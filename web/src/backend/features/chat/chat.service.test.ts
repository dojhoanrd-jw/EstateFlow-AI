import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/backend/server/lib/api-error';

// Mock dependencies before importing the service
vi.mock('./chat.repository', () => ({
  chatRepository: {
    startChat: vi.fn(),
    findByToken: vi.fn(),
    insertMessage: vi.fn(),
    getMessages: vi.fn(),
    countMessages: vi.fn(),
  },
}));

vi.mock('@/backend/features/conversations/messages/message.repository', () => ({
  messageRepository: {
    getSenderName: vi.fn(),
  },
}));

vi.mock('node:crypto', () => ({
  randomUUID: () => 'mocked-uuid-1234',
}));

import { chatService } from './chat.service';
import { chatRepository } from './chat.repository';
import { messageRepository } from '@/backend/features/conversations/messages/message.repository';

const mockChatRepo = vi.mocked(chatRepository);
const mockMessageRepo = vi.mocked(messageRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('chatService.startChat', () => {
  it('creates a chat and returns token, conversation_id, lead_id', async () => {
    mockChatRepo.startChat.mockResolvedValue({
      chat_token: 'mocked-uuid-1234',
      conversation_id: 'conv-1',
      lead_id: 'lead-1',
    });

    const result = await chatService.startChat({
      name: 'John Doe',
      message: 'I want to buy a house',
    });

    expect(result).toEqual({
      chat_token: 'mocked-uuid-1234',
      conversation_id: 'conv-1',
      lead_id: 'lead-1',
    });

    expect(mockChatRepo.startChat).toHaveBeenCalledWith({
      name: 'John Doe',
      email: undefined,
      phone: undefined,
      project_interest: undefined,
      message: 'I want to buy a house',
      chatToken: 'mocked-uuid-1234',
    });
  });

  it('passes optional fields to repository', async () => {
    mockChatRepo.startChat.mockResolvedValue({
      chat_token: 'mocked-uuid-1234',
      conversation_id: 'conv-2',
      lead_id: 'lead-2',
    });

    await chatService.startChat({
      name: 'Jane',
      email: 'jane@test.com',
      phone: '+1234',
      project_interest: 'Tower A',
      message: 'Hello',
    });

    expect(mockChatRepo.startChat).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@test.com',
        phone: '+1234',
        project_interest: 'Tower A',
      }),
    );
  });
});

describe('chatService.sendMessage', () => {
  const activeConversation = {
    id: 'conv-1',
    lead_id: 'lead-1',
    assigned_agent_id: null,
    chat_token: 'token-abc',
    status: 'active',
  };

  it('sends a message and returns with sender_name', async () => {
    mockChatRepo.findByToken.mockResolvedValue(activeConversation);
    mockChatRepo.insertMessage.mockResolvedValue({
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_type: 'lead',
      sender_id: 'lead-1',
      content: 'Hello agent',
      content_type: 'text',
      is_read: false,
      created_at: '2025-01-01T00:00:00Z',
    });
    mockMessageRepo.getSenderName.mockResolvedValue('John Doe');

    const result = await chatService.sendMessage('token-abc', {
      content: 'Hello agent',
      content_type: 'text',
    });

    expect(result.sender_name).toBe('John Doe');
    expect(result.content).toBe('Hello agent');
    expect(mockChatRepo.insertMessage).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      leadId: 'lead-1',
      content: 'Hello agent',
      contentType: 'text',
    });
  });

  it('throws NOT_FOUND for invalid token', async () => {
    mockChatRepo.findByToken.mockResolvedValue(null);

    await expect(
      chatService.sendMessage('bad-token', { content: 'hi', content_type: 'text' }),
    ).rejects.toThrow(ApiError);

    try {
      await chatService.sendMessage('bad-token', { content: 'hi', content_type: 'text' });
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(404);
    }
  });

  it('throws BAD_REQUEST for archived conversation', async () => {
    mockChatRepo.findByToken.mockResolvedValue({
      ...activeConversation,
      status: 'archived',
    });

    await expect(
      chatService.sendMessage('token-abc', { content: 'hi', content_type: 'text' }),
    ).rejects.toThrow(ApiError);

    try {
      await chatService.sendMessage('token-abc', { content: 'hi', content_type: 'text' });
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(400);
      expect((err as ApiError).message).toContain('archived');
    }
  });
});

describe('chatService.getMessages', () => {
  it('returns messages with pagination meta', async () => {
    mockChatRepo.findByToken.mockResolvedValue({
      id: 'conv-1',
      lead_id: 'lead-1',
      assigned_agent_id: null,
      chat_token: 'token-abc',
      status: 'active',
    });

    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_type: 'lead' as const,
        sender_id: 'lead-1',
        content: 'Hello',
        content_type: 'text' as const,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
        sender_name: 'John',
      },
    ];

    mockChatRepo.getMessages.mockResolvedValue(mockMessages);
    mockChatRepo.countMessages.mockResolvedValue(1);

    const result = await chatService.getMessages('token-abc', 1, 20);

    expect(result.conversation_id).toBe('conv-1');
    expect(result.messages).toHaveLength(1);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      total_pages: 1,
    });
  });

  it('throws NOT_FOUND for invalid token', async () => {
    mockChatRepo.findByToken.mockResolvedValue(null);

    await expect(
      chatService.getMessages('bad-token', 1, 20),
    ).rejects.toThrow(ApiError);
  });
});
