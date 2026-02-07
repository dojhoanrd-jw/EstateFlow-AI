// ============================================
// User
// ============================================

export type UserRole = 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'is_active' | 'updated_at'>;

// ============================================
// Lead
// ============================================

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  project_interest: string | null;
  source: string | null;
  budget: number | null;
  notes: string | null;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Conversation
// ============================================

export type ConversationPriority = 'high' | 'medium' | 'low';
export type ConversationStatus = 'active' | 'archived';

export interface Conversation {
  id: string;
  lead_id: string;
  assigned_agent_id: string;
  status: ConversationStatus;
  ai_summary: string | null;
  ai_priority: ConversationPriority;
  ai_tags: string[];
  is_read: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithLead extends Conversation {
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  lead_project: string | null;
  last_message: string | null;
  message_count: number;
  unread_count: number;
}

// ============================================
// Message
// ============================================

export type MessageSenderType = 'agent' | 'lead';
export type MessageContentType = 'text' | 'image';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  is_read: boolean;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender_name: string;
}

// ============================================
// Dashboard
// ============================================

export interface DashboardStats {
  total_conversations: number;
  unreplied_conversations: number;
  high_priority_unattended: number;
  avg_response_time_minutes: number;
  conversations_by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  conversations_by_agent: {
    agent_id: string;
    agent_name: string;
    count: number;
    unreplied: number;
  }[];
  top_tags: {
    tag: string;
    count: number;
  }[];
}

// ============================================
// AI
// ============================================

export interface AIAnalysis {
  summary: string;
  tags: string[];
  priority: ConversationPriority;
}

// ============================================
// API Responses
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    issues?: { field: string; message: string }[];
  };
}

// ============================================
// WebSocket Events
// ============================================

export interface WSNewMessage {
  conversation_id: string;
  message: MessageWithSender;
}

export interface WSTypingEvent {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface WSConversationUpdate {
  conversation: ConversationWithLead;
}
