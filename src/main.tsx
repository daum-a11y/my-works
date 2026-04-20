import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FontPreferenceProvider } from './preferences/FontPreferenceContext';
import { ThemePreferenceProvider } from './preferences/ThemePreferenceContext';
import { RootRouter } from './router/RootRouter';
import './styles/theme-tokens.css';
import './styles/krds.scss';
import './styles/app.scss';
// import './styles/components/SortableTableHeaderButton.scss';

const container = document.getElementById('wrap');

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
          <RootRouter />
        </QueryClientProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  </StrictMode>,
);
