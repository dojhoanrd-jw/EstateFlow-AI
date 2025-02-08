import { db } from '@/backend/server/db/client';
import { conversationRepository } from './conversation.repository';
import { broadcastToConversation } from '@/backend/server/socket/io';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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

/**
 * Trigger AI analysis for a conversation.
 * Fetches all messages, sends them to the AI service, and updates the conversation
 * with the results. Designed to be called fire-and-forget (don't await).
 */
export async function triggerAIAnalysis(conversationId: string): Promise<void> {
  try {
    const messages = await db.queryMany<MessageForAnalysis>(
      SQL_ALL_MESSAGES_WITH_SENDERS,
      [conversationId],
    );

    if (messages.length === 0) return;

    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages: messages.map((m) => ({
          sender_type: m.sender_type,
          sender_name: m.sender_name,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      console.error(`[AI Analysis] Failed for ${conversationId}: ${response.status}`);
      return;
    }

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
  } catch (error) {
    console.error(`[AI Analysis] Error for ${conversationId}:`, error);
  }
}
