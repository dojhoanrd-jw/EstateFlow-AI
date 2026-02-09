import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/shared/**', 'src/backend/server/lib/**', 'src/backend/features/chat/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/backend': path.resolve(__dirname, 'src/backend'),
      '@/frontend': path.resolve(__dirname, 'src/frontend'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
