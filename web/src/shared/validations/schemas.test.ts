import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createMessageSchema,
  startPublicChatSchema,
  publicChatMessageSchema,
  createLeadSchema,
  conversationFiltersSchema,
  createUserSchema,
} from './schemas';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.parse({ email: 'user@test.com', password: 'secret123' });
    expect(result.email).toBe('user@test.com');
  });

  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'bad', password: 'secret123' })).toThrow();
  });

  it('rejects short password', () => {
    expect(() => loginSchema.parse({ email: 'user@test.com', password: '12345' })).toThrow();
  });

  it('rejects missing fields', () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

describe('createMessageSchema', () => {
  it('accepts text message with default content_type', () => {
    const result = createMessageSchema.parse({ content: 'Hello' });
    expect(result.content_type).toBe('text');
  });

  it('accepts image content_type', () => {
    const result = createMessageSchema.parse({ content: 'https://img.com/a.png', content_type: 'image' });
    expect(result.content_type).toBe('image');
  });

  it('strips HTML from content', () => {
    const result = createMessageSchema.parse({ content: '<script>alert("xss")</script>Hello' });
    expect(result.content).toBe('alert("xss")Hello');
    expect(result.content).not.toContain('<script>');
  });

  it('rejects empty content', () => {
    expect(() => createMessageSchema.parse({ content: '' })).toThrow();
  });

  it('rejects content over 5000 chars', () => {
    expect(() => createMessageSchema.parse({ content: 'a'.repeat(5001) })).toThrow();
  });

  it('rejects invalid content_type', () => {
    expect(() => createMessageSchema.parse({ content: 'hi', content_type: 'video' })).toThrow();
  });
});

describe('startPublicChatSchema', () => {
  it('accepts valid public chat start', () => {
    const result = startPublicChatSchema.parse({
      name: 'John Doe',
      message: 'I want to buy an apartment',
    });
    expect(result.name).toBe('John Doe');
    expect(result.message).toBe('I want to buy an apartment');
  });

  it('accepts optional email and phone', () => {
    const result = startPublicChatSchema.parse({
      name: 'Jane',
      email: 'jane@test.com',
      phone: '+1234567890',
      message: 'Hello',
    });
    expect(result.email).toBe('jane@test.com');
    expect(result.phone).toBe('+1234567890');
  });

  it('strips HTML from name and message', () => {
    const result = startPublicChatSchema.parse({
      name: '<b>Hacker</b>',
      message: '<img onerror="alert(1)">Hi',
    });
    expect(result.name).toBe('Hacker');
    expect(result.message).toBe('Hi');
  });

  it('rejects missing name', () => {
    expect(() => startPublicChatSchema.parse({ message: 'hi' })).toThrow();
  });

  it('rejects missing message', () => {
    expect(() => startPublicChatSchema.parse({ name: 'John' })).toThrow();
  });

  it('rejects name over 120 chars', () => {
    expect(() => startPublicChatSchema.parse({
      name: 'a'.repeat(121),
      message: 'hi',
    })).toThrow();
  });
});

describe('publicChatMessageSchema', () => {
  it('defaults content_type to text', () => {
    const result = publicChatMessageSchema.parse({ content: 'Hello' });
    expect(result.content_type).toBe('text');
  });

  it('strips HTML from content', () => {
    const result = publicChatMessageSchema.parse({ content: '<div>Hi</div>' });
    expect(result.content).toBe('Hi');
  });
});

describe('createLeadSchema', () => {
  it('accepts valid lead', () => {
    const result = createLeadSchema.parse({ name: 'Lead Name' });
    expect(result.name).toBe('Lead Name');
  });

  it('strips HTML from all text fields', () => {
    const result = createLeadSchema.parse({
      name: '<b>Lead</b>',
      project_interest: '<script>xss</script>Tower A',
      notes: '<div>Some notes</div>',
    });
    expect(result.name).toBe('Lead');
    expect(result.project_interest).toBe('xssTower A');
    expect(result.notes).toBe('Some notes');
  });

  it('rejects invalid email', () => {
    expect(() => createLeadSchema.parse({ name: 'Lead', email: 'bad' })).toThrow();
  });

  it('accepts valid budget', () => {
    const result = createLeadSchema.parse({ name: 'Lead', budget: 500000 });
    expect(result.budget).toBe(500000);
  });

  it('rejects negative budget', () => {
    expect(() => createLeadSchema.parse({ name: 'Lead', budget: -100 })).toThrow();
  });
});

describe('conversationFiltersSchema', () => {
  it('provides sane defaults', () => {
    const result = conversationFiltersSchema.parse({});
    expect(result).toMatchObject({
      status: 'active',
      assignment: 'mine',
      page: 1,
      limit: 20,
    });
  });

  it('accepts valid priority filter', () => {
    const result = conversationFiltersSchema.parse({ priority: 'high' });
    expect(result.priority).toBe('high');
  });

  it('rejects invalid priority', () => {
    expect(() => conversationFiltersSchema.parse({ priority: 'urgent' })).toThrow();
  });

  it('strips HTML from search', () => {
    const result = conversationFiltersSchema.parse({ search: '<b>test</b>' });
    expect(result.search).toBe('test');
  });
});

describe('createUserSchema', () => {
  it('defaults role to agent', () => {
    const result = createUserSchema.parse({
      name: 'Agent Smith',
      email: 'smith@test.com',
      password: 'secret123',
    });
    expect(result.role).toBe('agent');
  });

  it('accepts admin role', () => {
    const result = createUserSchema.parse({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'secret123',
      role: 'admin',
    });
    expect(result.role).toBe('admin');
  });

  it('rejects invalid role', () => {
    expect(() => createUserSchema.parse({
      name: 'User',
      email: 'u@t.com',
      password: 'secret123',
      role: 'superadmin',
    })).toThrow();
  });
});
