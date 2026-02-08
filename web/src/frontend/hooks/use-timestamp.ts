'use client';

import { useSyncExternalStore } from 'react';

// ============================================
// useTimestamp
//
// A lightweight hook that triggers a re-render
// every 60s so relative timestamps ("2min ago")
// stay fresh. Uses useSyncExternalStore so only
// components that call this hook re-render —
// not the entire page tree.
// ============================================

let tick = 0;
const listeners = new Set<() => void>();

// Single shared interval for all subscribers
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
