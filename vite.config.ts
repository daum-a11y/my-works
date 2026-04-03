import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function manualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router/') ||
    id.includes('/react-router-dom/')
  ) {
    return 'react';
  }

  if (id.includes('/@supabase/') || id.includes('/@tanstack/')) {
    return 'data';
  }

  if (
    id.includes('/react-hook-form/') ||
    id.includes('/zod/') ||
    id.includes('/@hookform/resolvers/')
  ) {
    return 'forms';
  }

  if (id.includes('/react-aria-components/')) {
    return 'a11y';
  }

  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
