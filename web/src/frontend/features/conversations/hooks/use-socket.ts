'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// Types
// ============================================

interface TypingUser {
  user_name: string;
  is_typing: boolean;
}

// ============================================
// useTypingIndicator
//
// Placeholder hook that simulates typing.
// After the agent sends a message, it shows
// the lead "typing" for a short period to
// simulate a real-time experience.
// ============================================

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers when conversation changes or component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, [conversationId]);

  // Reset typing state when conversation changes
  useEffect(() => {
    setTypingUsers([]);
  }, [conversationId]);

  // ----------------------------------------
  // emitTyping: call this after the agent
  // sends a message to simulate the lead
  // starting to type a reply
  // ----------------------------------------

  const emitTyping = useCallback(
    (leadName: string = 'Lead') => {
      if (!conversationId) return;

      // Clear any existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);

      // Simulate the lead starting to type after a short delay
      timeoutRef.current = setTimeout(() => {
        setTypingUsers([{ user_name: leadName, is_typing: true }]);

        // Stop typing after 2-4 seconds (random for realism)
        const typingDuration = 2000 + Math.random() * 2000;
        clearTimeoutRef.current = setTimeout(() => {
          setTypingUsers([]);
        }, typingDuration);
      }, 800);
    },
    [conversationId],
  );

  return {
    typingUsers: typingUsers.filter((u) => u.is_typing),
    emitTyping,
  };
}
