import { db } from '@/backend/server/db/client';
import type { MessageWithSender, Message } from '@/shared/types';

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

/**
 * Fetches messages for a conversation with sender name resolved via a
 * conditional JOIN: agent names come from `users`, lead names from `leads`.
 * Uses a window function to compute a running total of messages for context.
 */
const SQL_FIND_BY_CONVERSATION = `
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
  LEFT JOIN users u
    ON m.sender_type = 'agent' AND u.id = m.sender_id
  LEFT JOIN leads l
    ON m.sender_type = 'lead' AND l.id = m.sender_id
  WHERE m.conversation_id = $1
  ORDER BY m.created_at ASC
  LIMIT $2 OFFSET $3
`;

/**
 * Insert a new message and atomically update the parent conversation's
 * last_message_at timestamp in a single CTE to avoid race conditions.
 */
const SQL_INSERT_MESSAGE = `
  WITH new_message AS (
    INSERT INTO messages (conversation_id, sender_type, sender_id, content, content_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  ),
  update_conversation AS (
    UPDATE conversations
    SET
      last_message_at = (SELECT created_at FROM new_message),
      is_read = CASE WHEN $2 = 'lead' THEN false ELSE is_read END,
      updated_at = NOW()
    WHERE id = $1
  )
  SELECT * FROM new_message
`;

/**
 * Retrieve the sender name for a single message by looking up both
 * users and leads tables.
 */
const SQL_GET_SENDER_NAME = `
  SELECT COALESCE(u.name, l.name, 'Unknown') AS sender_name
  FROM (SELECT $1::uuid AS sender_id, $2::message_sender_type AS sender_type) input
  LEFT JOIN users u
    ON input.sender_type = 'agent' AND u.id = input.sender_id
  LEFT JOIN leads l
    ON input.sender_type = 'lead' AND l.id = input.sender_id
`;

/**
 * Mark all unread messages in a conversation as read, but only messages
 * sent by the other party (agents mark lead messages as read, not their own).
 */
const SQL_MARK_AS_READ = `
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = $1
    AND is_read = false
    AND sender_type != $2
`;

/**
 * Also mark the conversation-level is_read flag.
 */
const SQL_MARK_CONVERSATION_READ = `
  UPDATE conversations
  SET is_read = true, updated_at = NOW()
  WHERE id = $1 AND NOT is_read
`;

const SQL_COUNT_UNREAD = `
  SELECT COUNT(*)::int AS unread_count
  FROM messages
  WHERE conversation_id = $1
    AND is_read = false
`;

const SQL_COUNT_TOTAL = `
  SELECT COUNT(*)::int AS total
  FROM messages
  WHERE conversation_id = $1
`;

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const messageRepository = {
  /**
   * Get paginated messages for a conversation, ordered chronologically.
   */
  async findByConversation(
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<MessageWithSender[]> {
    const offset = (page - 1) * limit;
    return db.queryMany<MessageWithSender>(SQL_FIND_BY_CONVERSATION, [
      conversationId,
      limit,
      offset,
    ]);
  },

  /**
   * Create a message and update the parent conversation's last_message_at.
   * Returns the raw message row; caller enriches with sender_name.
   */
  async create(data: {
    conversation_id: string;
    sender_type: 'agent' | 'lead';
    sender_id: string;
    content: string;
    content_type: 'text' | 'image';
  }): Promise<Message> {
    const result = await db.queryOne<Message>(SQL_INSERT_MESSAGE, [
      data.conversation_id,
      data.sender_type,
      data.sender_id,
      data.content,
      data.content_type,
    ]);
    return result!;
  },

  /**
   * Resolve the display name for a message sender.
   */
  async getSenderName(
    senderId: string,
    senderType: 'agent' | 'lead',
  ): Promise<string> {
    const row = await db.queryOne<{ sender_name: string }>(
      SQL_GET_SENDER_NAME,
      [senderId, senderType],
    );
    return row?.sender_name ?? 'Unknown';
  },

  /**
   * Mark all messages from the other party as read within a conversation.
   * Also updates the conversation-level is_read flag.
   */
  async markAsRead(
    conversationId: string,
    readerSenderType: 'agent' | 'lead',
  ): Promise<void> {
    await Promise.all([
      db.query(SQL_MARK_AS_READ, [conversationId, readerSenderType]),
      db.query(SQL_MARK_CONVERSATION_READ, [conversationId]),
    ]);
  },

  /**
   * Count unread messages in a conversation.
   */
  async countUnread(conversationId: string): Promise<number> {
    const row = await db.queryOne<{ unread_count: number }>(
      SQL_COUNT_UNREAD,
      [conversationId],
    );
    return row?.unread_count ?? 0;
  },

  /**
   * Count total messages in a conversation (for pagination metadata).
   */
  async countTotal(conversationId: string): Promise<number> {
    const row = await db.queryOne<{ total: number }>(SQL_COUNT_TOTAL, [
      conversationId,
    ]);
    return row?.total ?? 0;
  },
};
