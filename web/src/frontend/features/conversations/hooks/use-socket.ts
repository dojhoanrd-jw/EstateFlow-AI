'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { MessageWithSender, TypingUser } from '@/shared/types';
import { socketConfig } from '@/frontend/config/socket';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(socketConfig);
  }
  return socketInstance;
}

export function useSocket(conversationId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevRoomRef = useRef<string | null>(null);
  const onMessageRef = useRef<((msg: MessageWithSender) => void) | null>(null);
  const onAiUpdateRef = useRef<(() => void) | null>(null);
  const onTypingEventRef = useRef<((data: { userName: string; isTyping: boolean }) => void) | null>(null);

  useEffect(() => {
    if (!conversationId) {
      if (prevRoomRef.current && socketRef.current) {
        socketRef.current.emit('leave', prevRoomRef.current);
        prevRoomRef.current = null;
      }
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: Error) => {
      console.error('[Socket.IO] error:', err.message);
    };
    const handleConnectError = (err: Error) => {
      console.error('[Socket.IO] connect_error:', err.message);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) setIsConnected(true);

    if (prevRoomRef.current && prevRoomRef.current !== conversationId) {
      socket.emit('leave', prevRoomRef.current);
    }
    socket.emit('join', conversationId);
    prevRoomRef.current = conversationId;

    const handleNewMessage = (data: MessageWithSender) => {
      if (onMessageRef.current) onMessageRef.current(data);
    };
    socket.on('new_message', handleNewMessage);

    const handleAiUpdate = () => {
      if (onAiUpdateRef.current) onAiUpdateRef.current();
    };
    socket.on('ai_update', handleAiUpdate);

    const handleTyping = (data: { userName: string; isTyping: boolean }) => {
      if (onTypingEventRef.current) onTypingEventRef.current(data);
    };
    socket.on('typing', handleTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('new_message', handleNewMessage);
      socket.off('ai_update', handleAiUpdate);
      socket.off('typing', handleTyping);
    };
  }, [conversationId]);

  const onMessage = useCallback((handler: (msg: MessageWithSender) => void) => {
    onMessageRef.current = handler;
  }, []);

  const onAiUpdate = useCallback((handler: () => void) => {
    onAiUpdateRef.current = handler;
  }, []);

  const onTypingEvent = useCallback((handler: (data: { userName: string; isTyping: boolean }) => void) => {
    onTypingEventRef.current = handler;
  }, []);

  const sendTyping = useCallback(
    (userName: string) => {
      if (socketRef.current?.connected && conversationId) {
        socketRef.current.emit('typing', {
          conversationId,
          userName,
          isTyping: true,
        });
      }
    },
    [conversationId],
  );

  return { isConnected, onMessage, onAiUpdate, onTypingEvent, sendTyping };
}

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setTypingUsers([]);
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  }, [conversationId]);

  const showTyping = useCallback(
    (userName: string) => {
      if (!conversationId) return;

      const existing = timersRef.current.get(userName);
      if (existing) clearTimeout(existing);

      setTypingUsers((prev) => {
        const without = prev.filter((u) => u.user_name !== userName);
        return [...without, { user_name: userName, is_typing: true }];
      });

      timersRef.current.set(
        userName,
        setTimeout(() => {
          timersRef.current.delete(userName);
          setTypingUsers((prev) => prev.filter((u) => u.user_name !== userName));
        }, 3000),
      );
    },
    [conversationId],
  );

  const hideTyping = useCallback((userName: string) => {
    const existing = timersRef.current.get(userName);
    if (existing) clearTimeout(existing);
    timersRef.current.delete(userName);
    setTypingUsers((prev) => prev.filter((u) => u.user_name !== userName));
  }, []);

  return {
    typingUsers: typingUsers.filter((u) => u.is_typing),
    showTyping,
    hideTyping,
  };
}
