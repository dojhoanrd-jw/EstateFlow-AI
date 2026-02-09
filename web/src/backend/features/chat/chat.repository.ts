import { db } from '@/backend/server/db/client';
import type { Message, MessageWithSender } from '@/shared/types';

const SQL_START_CHAT = `
  WITH new_lead AS (
    INSERT INTO leads (name, email, phone, project_interest, source)
    VALUES ($1, $2, $3, $4, 'public_chat')
    RETURNING id
  ),
  new_conversation AS (
    INSERT INTO conversations (lead_id, assigned_agent_id, chat_token, last_message_at)
    VALUES ((SELECT id FROM new_lead), NULL, $5, NOW())
    RETURNING id, chat_token, lead_id
  ),
  first_message AS (
    INSERT INTO messages (conversation_id, sender_type, sender_id, content, content_type)
    VALUES (
      (SELECT id FROM new_conversation),
      'lead',
      (SELECT id FROM new_lead),
      $6,
      'text'
    )
    RETURNING *
  )
  SELECT
    nc.id AS conversation_id,
    nc.chat_token,
    nc.lead_id
  FROM new_conversation nc
`;

const SQL_FIND_BY_TOKEN = `
  SELECT
    c.id,
    c.lead_id,
    c.assigned_agent_id,
    c.chat_token,
    c.status
  FROM conversations c
  WHERE c.chat_token = $1
  LIMIT 1
`;

const SQL_FIND_MESSAGES = `
  SELECT
    m.id,
    m.conversation_id,
    m.sender_type,
    m.sender_id,
    m.content,
    m.content_type,
    m.is_read,
    m.created_at,
    COALESCE(u.name, l.name, 'Unknown') AS sender_name
  FROM messages m
  LEFT JOIN users u ON m.sender_type = 'agent' AND u.id = m.sender_id
  LEFT JOIN leads l ON m.sender_type = 'lead' AND l.id = m.sender_id
  WHERE m.conversation_id = (
    SELECT c.id FROM conversations c WHERE c.chat_token = $1 LIMIT 1
  )
  ORDER BY m.created_at ASC
  LIMIT $2 OFFSET $3
`;

const SQL_COUNT_MESSAGES = `
  SELECT COUNT(*)::int AS total
  FROM messages
  WHERE conversation_id = (
    SELECT c.id FROM conversations c WHERE c.chat_token = $1 LIMIT 1
  )
`;

const SQL_INSERT_MESSAGE = `
  WITH new_message AS (
    INSERT INTO messages (conversation_id, sender_type, sender_id, content, content_type)
    VALUES ($1, 'lead', $2, $3, $4)
    RETURNING *
  ),
  update_conversation AS (
    UPDATE conversations
    SET
      last_message_at = (SELECT created_at FROM new_message),
      is_read = false,
      updated_at = NOW()
    WHERE id = $1
  )
  SELECT * FROM new_message
`;

export interface ChatConversation {
  id: string;
  lead_id: string;
  assigned_agent_id: string | null;
  chat_token: string;
  status: string;
}

export const chatRepository = {
  async startChat(data: {
    name: string;
    email?: string;
    phone?: string;
    project_interest?: string;
    message: string;
    chatToken: string;
  }) {
    const result = await db.queryOne<{
      conversation_id: string;
      chat_token: string;
      lead_id: string;
    }>(SQL_START_CHAT, [
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.project_interest ?? null,
      data.chatToken,
      data.message,
    ]);
    if (!result) throw new Error('Failed to start chat');
    return result;
  },

  async findByToken(token: string): Promise<ChatConversation | null> {
    return db.queryOne<ChatConversation>(SQL_FIND_BY_TOKEN, [token]);
  },

  async getMessages(
    token: string,
    page: number,
    limit: number,
  ): Promise<MessageWithSender[]> {
    const offset = (page - 1) * limit;
    return db.queryMany<MessageWithSender>(SQL_FIND_MESSAGES, [token, limit, offset]);
  },

  async countMessages(token: string): Promise<number> {
    const row = await db.queryOne<{ total: number }>(SQL_COUNT_MESSAGES, [token]);
    return row?.total ?? 0;
  },

  async insertMessage(data: {
    conversationId: string;
    leadId: string;
    content: string;
    contentType: 'text' | 'image';
  }): Promise<Message> {
    const result = await db.queryOne<Message>(SQL_INSERT_MESSAGE, [
      data.conversationId,
      data.leadId,
      data.content,
      data.contentType,
    ]);
    if (!result) throw new Error('INSERT did not return a row');
    return result;
  },
};
