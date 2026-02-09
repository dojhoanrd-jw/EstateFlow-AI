'use client';

import { useState } from 'react';
import { StartChatForm } from '../components/start-chat-form';
import { ChatWindow } from '../components/chat-window';

interface ChatSession {
  chat_token: string;
  conversation_id: string;
  lead_id: string;
  name: string;
}

export function PublicChatPage() {
  const [session, setSession] = useState<ChatSession | null>(null);

  if (!session) {
    return <StartChatForm onStarted={setSession} />;
  }

  return (
    <div className="w-full h-[calc(100dvh-3rem)] max-h-[700px]">
      <ChatWindow
        chatToken={session.chat_token}
        conversationId={session.conversation_id}
        leadName={session.name}
        initialMessage={null}
      />
    </div>
  );
}
