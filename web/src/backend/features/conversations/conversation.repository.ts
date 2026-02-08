import { db } from '@/backend/server/db/client';
import { buildUpdateQuery } from '@/backend/server/db/build-update-query';
import type { Conversation, ConversationWithLead } from '@/shared/types';
import type {
  CreateConversationInput,
  UpdateConversationInput,
  ConversationFilters,
} from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Column mapping for dynamic updates
// ---------------------------------------------------------------------------

const UPDATABLE_COLUMNS: Record<keyof UpdateConversationInput, string> = {
  status: 'status',
  is_read: 'is_read',
  ai_summary: 'ai_summary',
  ai_priority: 'ai_priority',
  ai_tags: 'ai_tags',
};

// ---------------------------------------------------------------------------
// SQL Fragments
// ---------------------------------------------------------------------------

const SELECT_CONVERSATION_WITH_LEAD = `
  SELECT
    c.id,
    c.lead_id,
    c.assigned_agent_id,
    c.status,
    c.ai_summary,
    c.ai_priority,
    c.ai_tags,
    c.is_read,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    l.name    AS lead_name,
    l.email   AS lead_email,
    l.phone   AS lead_phone,
    l.project_interest AS lead_project,
    lm.content AS last_message,
    COALESCE(mc.message_count, 0)::int  AS message_count,
    COALESCE(mc.unread_count, 0)::int   AS unread_count
  FROM conversations c
  INNER JOIN leads l ON l.id = c.lead_id
  LEFT JOIN LATERAL (
    SELECT m.content
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS message_count,
      COUNT(*) FILTER (WHERE NOT m.is_read AND m.sender_type = 'lead')::int AS unread_count
    FROM messages m
    WHERE m.conversation_id = c.id
  ) mc ON true
`;

const SQL_FIND_BY_ID = `
  ${SELECT_CONVERSATION_WITH_LEAD}
  WHERE c.id = $1
  LIMIT 1
`;

const SQL_INSERT = `
  INSERT INTO conversations (lead_id, assigned_agent_id)
  VALUES ($1, $2)
  RETURNING *
`;

// ---------------------------------------------------------------------------
// Dynamic query builder
// ---------------------------------------------------------------------------

interface QueryBuilderResult {
  text: string;
  params: unknown[];
}

function buildListQuery(
  agentId: string | null,
  filters: ConversationFilters,
  mode: 'rows' | 'count',
): QueryBuilderResult {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Agent scope
  if (agentId) {
    conditions.push(`c.assigned_agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  // Status filter (always present due to schema default)
  conditions.push(`c.status = $${paramIndex++}`);
  params.push(filters.status);

  // Priority filter
  if (filters.priority) {
    conditions.push(`c.ai_priority = $${paramIndex++}`);
    params.push(filters.priority);
  }

  // Tag filter (uses array contains operator)
  if (filters.tag) {
    conditions.push(`$${paramIndex++} = ANY(c.ai_tags)`);
    params.push(filters.tag);
  }

  // Full-text search on lead name, email, or conversation summary
  if (filters.search) {
    conditions.push(`(
      l.name ILIKE $${paramIndex}
      OR l.email ILIKE $${paramIndex}
      OR c.ai_summary ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  if (mode === 'count') {
    return {
      text: `
        SELECT COUNT(*)::int AS total
        FROM conversations c
        INNER JOIN leads l ON l.id = c.lead_id
        ${whereClause}
      `,
      params,
    };
  }

  const offset = (filters.page - 1) * filters.limit;

  return {
    text: `
      ${SELECT_CONVERSATION_WITH_LEAD}
      ${whereClause}
      ORDER BY
        CASE c.ai_priority
          WHEN 'high'   THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low'    THEN 3
        END,
        c.last_message_at DESC NULLS LAST,
        c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `,
    params: [...params, filters.limit, offset],
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const conversationRepository = {
  /**
   * List conversations assigned to a specific agent with filters and pagination.
   */
  async findByAgent(
    agentId: string,
    filters: ConversationFilters,
  ): Promise<ConversationWithLead[]> {
    const { text, params } = buildListQuery(agentId, filters, 'rows');
    return db.queryMany<ConversationWithLead>(text, params);
  },

  /**
   * List all conversations (admin view) with filters and pagination.
   */
  async findAll(filters: ConversationFilters): Promise<ConversationWithLead[]> {
    const { text, params } = buildListQuery(null, filters, 'rows');
    return db.queryMany<ConversationWithLead>(text, params);
  },

  /**
   * Get a single conversation by ID, including lead info and message counts.
   */
  async findById(id: string): Promise<ConversationWithLead | null> {
    return db.queryOne<ConversationWithLead>(SQL_FIND_BY_ID, [id]);
  },

  /**
   * Create a new conversation.
   */
  async create(data: CreateConversationInput): Promise<Conversation> {
    const result = await db.queryOne<Conversation>(SQL_INSERT, [
      data.lead_id,
      data.assigned_agent_id,
    ]);
    if (!result) throw new Error('INSERT did not return a row');
    return result;
  },

  /**
   * Dynamically update a conversation with only the provided fields.
   * Uses a parameterized SET clause to prevent SQL injection.
   */
  async update(
    id: string,
    data: UpdateConversationInput,
  ): Promise<Conversation | null> {
    const query = buildUpdateQuery('conversations', id, data, UPDATABLE_COLUMNS);
    if (!query) return this.findById(id) as Promise<Conversation | null>;
    return db.queryOne<Conversation>(query.text, query.params);
  },

  /**
   * Count conversations matching filters, used for pagination metadata.
   */
  async countByFilters(
    agentId: string | null,
    filters: ConversationFilters,
  ): Promise<number> {
    const { text, params } = buildListQuery(agentId, filters, 'count');
    const row = await db.queryOne<{ total: number }>(text, params);
    return row?.total ?? 0;
  },
};
