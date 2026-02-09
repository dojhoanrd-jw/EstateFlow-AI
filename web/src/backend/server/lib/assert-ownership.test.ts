import { describe, it, expect } from 'vitest';
import { assertConversationAccess, assertConversationWriteAccess } from './assert-ownership';
import { ApiError } from './api-error';

const AGENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_AGENT_ID = '660e8400-e29b-41d4-a716-446655440000';

describe('assertConversationAccess (read)', () => {
  it('allows admin to access any conversation', () => {
    expect(() =>
      assertConversationAccess({ assigned_agent_id: OTHER_AGENT_ID }, AGENT_ID, 'admin'),
    ).not.toThrow();
  });

  it('allows admin to access unassigned conversation', () => {
    expect(() =>
      assertConversationAccess({ assigned_agent_id: null }, AGENT_ID, 'admin'),
    ).not.toThrow();
  });

  it('allows agent to access own conversation', () => {
    expect(() =>
      assertConversationAccess({ assigned_agent_id: AGENT_ID }, AGENT_ID, 'agent'),
    ).not.toThrow();
  });

  it('allows agent to read unassigned conversation', () => {
    expect(() =>
      assertConversationAccess({ assigned_agent_id: null }, AGENT_ID, 'agent'),
    ).not.toThrow();
  });

  it('blocks agent from accessing another agent conversation', () => {
    expect(() =>
      assertConversationAccess({ assigned_agent_id: OTHER_AGENT_ID }, AGENT_ID, 'agent'),
    ).toThrow(ApiError);

    try {
      assertConversationAccess({ assigned_agent_id: OTHER_AGENT_ID }, AGENT_ID, 'agent');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(403);
    }
  });
});

describe('assertConversationWriteAccess', () => {
  it('allows admin to write to any conversation', () => {
    expect(() =>
      assertConversationWriteAccess({ assigned_agent_id: null }, AGENT_ID, 'admin'),
    ).not.toThrow();
  });

  it('allows agent to write to own conversation', () => {
    expect(() =>
      assertConversationWriteAccess({ assigned_agent_id: AGENT_ID }, AGENT_ID, 'agent'),
    ).not.toThrow();
  });

  it('blocks agent from writing to unassigned conversation', () => {
    expect(() =>
      assertConversationWriteAccess({ assigned_agent_id: null }, AGENT_ID, 'agent'),
    ).toThrow(ApiError);

    try {
      assertConversationWriteAccess({ assigned_agent_id: null }, AGENT_ID, 'agent');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(403);
      expect((err as ApiError).message).toContain('Claim it first');
    }
  });

  it('blocks agent from writing to another agent conversation', () => {
    expect(() =>
      assertConversationWriteAccess({ assigned_agent_id: OTHER_AGENT_ID }, AGENT_ID, 'agent'),
    ).toThrow(ApiError);
  });
});
