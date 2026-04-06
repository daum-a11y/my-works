import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/AppRouter';
import { FontPreferenceProvider } from './app/FontPreferenceContext';
import { ThemePreferenceProvider } from './app/ThemePreferenceContext';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found.');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(container).render(
  <StrictMode>
    <ThemePreferenceProvider>
      <FontPreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  </StrictMode>,
);
