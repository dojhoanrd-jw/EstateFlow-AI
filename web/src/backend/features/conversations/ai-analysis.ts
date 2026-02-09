import { db } from '@/backend/server/db/client';
import { conversationRepository } from './conversation.repository';
import { broadcastToConversation } from '@/backend/server/socket/io';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

interface MessageForAnalysis {
  sender_type: 'agent' | 'lead';
  sender_name: string;
  content: string;
}

interface AnalyzeResponse {
  summary: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

const SQL_ALL_MESSAGES_WITH_SENDERS = `
  SELECT
    m.sender_type,
    COALESCE(u.name, l.name, 'Unknown') AS sender_name,
    m.content
  FROM messages m
  LEFT JOIN users u ON m.sender_type = 'agent' AND u.id = m.sender_id
  LEFT JOIN leads l ON m.sender_type = 'lead' AND l.id = m.sender_id
  WHERE m.conversation_id = $1
  ORDER BY m.created_at ASC
`;

const DEBOUNCE_MS = 2_000;
const MAX_PENDING_TIMERS = 5_000;
const pendingTimers = new Map<string, NodeJS.Timeout>();

export function debouncedTriggerAIAnalysis(conversationId: string): void {
  const existing = pendingTimers.get(conversationId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingTimers.delete(conversationId);
    triggerAIAnalysis(conversationId).catch(() => {});
  }, DEBOUNCE_MS);

  pendingTimers.set(conversationId, timer);

  // Flush oldest entries immediately if map grows too large
  if (pendingTimers.size > MAX_PENDING_TIMERS) {
    const excess = pendingTimers.size - MAX_PENDING_TIMERS;
    let cleared = 0;
    for (const [id, oldTimer] of pendingTimers) {
      if (cleared >= excess) break;
      clearTimeout(oldTimer);
      pendingTimers.delete(id);
      triggerAIAnalysis(id).catch(() => {});
      cleared++;
    }
  }
}

async function triggerAIAnalysis(conversationId: string): Promise<void> {
  try {
    const messages = await db.queryMany<MessageForAnalysis>(
      SQL_ALL_MESSAGES_WITH_SENDERS,
      [conversationId],
    );

    if (messages.length === 0) return;

    const payload = JSON.stringify({
      conversation_id: conversationId,
      messages: messages.map((m) => ({
        sender_type: m.sender_type,
        sender_name: m.sender_name,
        content: m.content,
      })),
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (AI_SERVICE_API_KEY) {
          headers['x-api-key'] = AI_SERVICE_API_KEY;
        }

        const response = await fetch(`${AI_SERVICE_URL}/v1/analyze`, {
          method: 'POST',
          headers,
          body: payload,
        });

        if (response.ok) {
          const result: AnalyzeResponse = await response.json();

          await conversationRepository.update(conversationId, {
            ai_summary: result.summary,
            ai_priority: result.priority,
            ai_tags: result.tags,
          });

          broadcastToConversation(conversationId, 'ai_update', {
            conversation_id: conversationId,
            ai_summary: result.summary,
            ai_priority: result.priority,
            ai_tags: result.tags,
          });

          return;
        }

        if (!isRetryable(response.status)) {
          console.error(`[AI Analysis] Non-retryable error for ${conversationId}: ${response.status}`);
          return;
        }

        lastError = new Error(`HTTP ${response.status}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      if (attempt < MAX_RETRIES - 1) {
        const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
        console.warn(`[AI Analysis] Attempt ${attempt + 1} failed for ${conversationId}, retrying in ${backoff}ms`);
        await delay(backoff);
      }
    }

    console.error(`[AI Analysis] All ${MAX_RETRIES} attempts failed for ${conversationId}:`, lastError);
  } catch (error) {
    console.error(`[AI Analysis] Error for ${conversationId}:`, error);
  }
}
