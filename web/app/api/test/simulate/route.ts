/**
 * POST /api/test/simulate
 *
 * Dev-only endpoint to simulate a lead sending a message.
 * Usage:
 *   curl -X POST http://localhost:3000/api/test/simulate \
 *     -H "Content-Type: application/json" \
 *     -d '{"conversation_id": "c1000000-0000-0000-0000-000000000001", "content": "Hola, quiero más información"}'
 */
import { NextResponse } from 'next/server';
import { db } from '@/backend/server/db/client';
import { broadcastToConversation } from '@/backend/server/socket/io';
import { debouncedTriggerAIAnalysis } from '@/backend/features/conversations/ai-analysis';

const SQL_GET_LEAD_ID = `
  SELECT lead_id FROM conversations WHERE id = $1
`;

const SQL_GET_LEAD_NAME = `
  SELECT name FROM leads WHERE id = $1
`;

const SQL_INSERT_LEAD_MESSAGE = `
  WITH new_message AS (
    INSERT INTO messages (conversation_id, sender_type, sender_id, content, content_type)
    VALUES ($1, 'lead', $2, $3, 'text')
    RETURNING *
  ),
  update_conversation AS (
    UPDATE conversations
    SET last_message_at = (SELECT created_at FROM new_message),
        is_read = false,
        updated_at = NOW()
    WHERE id = $1
  )
  SELECT * FROM new_message
`;

export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { conversation_id, content } = await req.json();

  if (!conversation_id || !content) {
    return NextResponse.json(
      { error: 'conversation_id and content are required' },
      { status: 400 },
    );
  }

  // Get lead ID from conversation
  const convRow = await db.queryOne<{ lead_id: string }>(SQL_GET_LEAD_ID, [conversation_id]);
  if (!convRow) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Get lead name
  const leadRow = await db.queryOne<{ name: string }>(SQL_GET_LEAD_NAME, [convRow.lead_id]);
  const leadName = leadRow?.name ?? 'Lead';

  // Insert message as lead
  const message = await db.queryOne(SQL_INSERT_LEAD_MESSAGE, [
    conversation_id,
    convRow.lead_id,
    content,
  ]);

  if (!message) {
    return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
  }

  const messageWithSender = { ...message, sender_name: leadName };

  // Broadcast via WebSocket
  broadcastToConversation(conversation_id, 'new_message', messageWithSender);

  // Fire-and-forget AI re-analysis with updated conversation
  debouncedTriggerAIAnalysis(conversation_id);

  return NextResponse.json({ ok: true, message: messageWithSender });
}
