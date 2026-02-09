-- Migration 003: Public Chat API
-- Allows conversations without an assigned agent + chat_token for public access.

-- 1. Make assigned_agent_id nullable
ALTER TABLE conversations
  ALTER COLUMN assigned_agent_id DROP NOT NULL;

-- 2. Change ON DELETE CASCADE to ON DELETE SET NULL
ALTER TABLE conversations
  DROP CONSTRAINT conversations_assigned_agent_id_fkey;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_assigned_agent_id_fkey
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add chat_token column (only public chats get one)
ALTER TABLE conversations
  ADD COLUMN chat_token UUID UNIQUE DEFAULT NULL;

-- 4. Partial index for fast token lookup
CREATE UNIQUE INDEX idx_conversations_chat_token
  ON conversations (chat_token) WHERE chat_token IS NOT NULL;

-- 5. Partial index for unassigned conversations
CREATE INDEX idx_conversations_unassigned
  ON conversations (status, last_message_at DESC)
  WHERE assigned_agent_id IS NULL;
