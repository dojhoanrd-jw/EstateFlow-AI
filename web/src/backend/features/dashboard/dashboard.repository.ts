import { db } from '@/backend/server/db/client';
import type { DashboardStats } from '@/shared/types';

// ---------------------------------------------------------------------------
// Row types returned by the individual CTEs / queries
// ---------------------------------------------------------------------------

interface SummaryRow {
  total_conversations: number;
  unreplied_conversations: number;
  high_priority_unattended: number;
}

interface PriorityRow {
  priority: 'high' | 'medium' | 'low';
  count: number;
}

interface AgentRow {
  agent_id: string;
  agent_name: string;
  count: number;
  unreplied: number;
}

interface TagRow {
  tag: string;
  count: number;
}

interface AvgResponseRow {
  avg_response_time_minutes: number;
}

// ---------------------------------------------------------------------------
// SQL: Summary statistics
// ---------------------------------------------------------------------------

/**
 * Uses CTEs and FILTER clauses to compute headline metrics in a single scan.
 *
 * - `last_msg` identifies the most recent message per conversation using
 *   a window function (ROW_NUMBER) so we can determine "unreplied" status
 *   without correlated subqueries.
 * - Conditional aggregation via FILTER avoids multiple passes over the data.
 * - The optional $1 parameter scopes results to a single agent when non-null.
 */
const SQL_SUMMARY = `
  WITH last_msg AS (
    SELECT
      m.conversation_id,
      m.sender_type,
      ROW_NUMBER() OVER (
        PARTITION BY m.conversation_id
        ORDER BY m.created_at DESC
      ) AS rn
    FROM messages m
  ),
  conv_status AS (
    SELECT
      c.id,
      c.ai_priority,
      lm.sender_type AS last_sender_type
    FROM conversations c
    LEFT JOIN last_msg lm
      ON lm.conversation_id = c.id AND lm.rn = 1
    WHERE c.status = 'active'
      AND ($1::uuid IS NULL OR c.assigned_agent_id = $1::uuid)
  )
  SELECT
    COUNT(*)::int                                                     AS total_conversations,
    COUNT(*) FILTER (WHERE last_sender_type = 'lead')::int            AS unreplied_conversations,
    COUNT(*) FILTER (
      WHERE ai_priority = 'high' AND last_sender_type = 'lead'
    )::int                                                            AS high_priority_unattended
  FROM conv_status
`;

// ---------------------------------------------------------------------------
// SQL: Conversations grouped by priority
// ---------------------------------------------------------------------------

/**
 * Conditional aggregation using FILTER to pivot priority counts into columns
 * in a single pass without CASE expressions.
 */
const SQL_BY_PRIORITY = `
  SELECT
    COALESCE(c.ai_priority, 'medium') AS priority,
    COUNT(*)::int                     AS count
  FROM conversations c
  WHERE c.status = 'active'
    AND ($1::uuid IS NULL OR c.assigned_agent_id = $1::uuid)
  GROUP BY c.ai_priority
  ORDER BY
    CASE c.ai_priority
      WHEN 'high'   THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low'    THEN 3
    END
`;

// ---------------------------------------------------------------------------
// SQL: Conversations grouped by agent
// ---------------------------------------------------------------------------

/**
 * JOINs users to get the agent name and uses a correlated lateral subquery
 * via FILTER on a window-based CTE to count unreplied conversations per agent.
 *
 * The CTE `last_msg_per_conv` uses ROW_NUMBER to efficiently pick the latest
 * message per conversation, avoiding a DISTINCT ON or MAX subquery.
 */
const SQL_BY_AGENT = `
  WITH last_msg_per_conv AS (
    SELECT
      m.conversation_id,
      m.sender_type,
      ROW_NUMBER() OVER (
        PARTITION BY m.conversation_id
        ORDER BY m.created_at DESC
      ) AS rn
    FROM messages m
  )
  SELECT
    u.id                                                           AS agent_id,
    u.name                                                         AS agent_name,
    COUNT(c.id)::int                                               AS count,
    COUNT(c.id) FILTER (WHERE lm.sender_type = 'lead')::int        AS unreplied
  FROM conversations c
  INNER JOIN users u ON u.id = c.assigned_agent_id
  LEFT JOIN last_msg_per_conv lm
    ON lm.conversation_id = c.id AND lm.rn = 1
  WHERE c.status = 'active'
    AND ($1::uuid IS NULL OR c.assigned_agent_id = $1::uuid)
  GROUP BY u.id, u.name
  ORDER BY count DESC
`;

// ---------------------------------------------------------------------------
// SQL: Top tags
// ---------------------------------------------------------------------------

/**
 * UNNEST expands the ai_tags array column so each tag becomes its own row.
 * We GROUP BY the unnested tag, count occurrences, and take the top 10.
 */
const SQL_TOP_TAGS = `
  SELECT
    tag,
    COUNT(*)::int AS count
  FROM (
    SELECT UNNEST(c.ai_tags) AS tag
    FROM conversations c
    WHERE c.status = 'active'
      AND c.ai_tags != '{}'
      AND ($1::uuid IS NULL OR c.assigned_agent_id = $1::uuid)
  ) expanded_tags
  GROUP BY tag
  ORDER BY count DESC, tag ASC
  LIMIT 10
`;

// ---------------------------------------------------------------------------
// SQL: Average response time
// ---------------------------------------------------------------------------

/**
 * Calculates the average agent response time in minutes.
 *
 * Strategy:
 *  1. Use LAG() window function to get the previous message's sender_type
 *     and timestamp within each conversation, ordered chronologically.
 *  2. Identify "response" rows: messages where the sender is 'agent' and
 *     the previous message was from 'lead'.
 *  3. Compute the time difference (in minutes) between each lead message
 *     and the agent's reply.
 *  4. Average all those deltas.
 *
 * This avoids self-joins and correlated subqueries.
 */
const SQL_AVG_RESPONSE_TIME = `
  WITH message_pairs AS (
    SELECT
      m.conversation_id,
      m.sender_type,
      m.created_at,
      LAG(m.sender_type) OVER (
        PARTITION BY m.conversation_id
        ORDER BY m.created_at ASC
      ) AS prev_sender_type,
      LAG(m.created_at) OVER (
        PARTITION BY m.conversation_id
        ORDER BY m.created_at ASC
      ) AS prev_created_at
    FROM messages m
    INNER JOIN conversations c ON c.id = m.conversation_id
    WHERE c.status = 'active'
      AND ($1::uuid IS NULL OR c.assigned_agent_id = $1::uuid)
  )
  SELECT
    COALESCE(
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (created_at - prev_created_at)) / 60.0
        )::numeric,
        1
      ),
      0
    )::float AS avg_response_time_minutes
  FROM message_pairs
  WHERE sender_type = 'agent'
    AND prev_sender_type = 'lead'
`;

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const dashboardRepository = {
  /**
   * Fetch all dashboard statistics. When `agentId` is provided, all queries
   * are scoped to that agent's conversations. When null, statistics cover
   * the entire system (admin view).
   *
   * All five queries run concurrently via Promise.all for minimal latency.
   */
  async getStats(agentId: string | null): Promise<DashboardStats> {
    const param = [agentId];

    const [summaryRow, priorityRows, agentRows, tagRows, avgRow] =
      await Promise.all([
        db.queryOne<SummaryRow>(SQL_SUMMARY, param),
        db.queryMany<PriorityRow>(SQL_BY_PRIORITY, param),
        db.queryMany<AgentRow>(SQL_BY_AGENT, param),
        db.queryMany<TagRow>(SQL_TOP_TAGS, param),
        db.queryOne<AvgResponseRow>(SQL_AVG_RESPONSE_TIME, param),
      ]);

    // Build the priority breakdown, defaulting missing priorities to 0
    const priorityMap: DashboardStats['conversations_by_priority'] = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const row of priorityRows) {
      if (row.priority in priorityMap) {
        priorityMap[row.priority] = row.count;
      }
    }

    return {
      total_conversations: summaryRow?.total_conversations ?? 0,
      unreplied_conversations: summaryRow?.unreplied_conversations ?? 0,
      high_priority_unattended: summaryRow?.high_priority_unattended ?? 0,
      avg_response_time_minutes: avgRow?.avg_response_time_minutes ?? 0,
      conversations_by_priority: priorityMap,
      conversations_by_agent: agentRows,
      top_tags: tagRows,
    };
  },
};
