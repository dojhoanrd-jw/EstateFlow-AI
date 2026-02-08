'use client';

import { useSyncExternalStore } from 'react';

let tick = 0;
const listeners = new Set<() => void>();

let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  if (!intervalId) {
    intervalId = setInterval(() => {
      tick += 1;
      listeners.forEach((fn) => fn());
    }, 60_000);
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot(): number {
  return tick;
}

export function useTimestamp(): void {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
