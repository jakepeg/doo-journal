import ReactDOM from 'react-dom/client';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { registerSW } from './utils/sw-registration';
import './utils/suppress-dev-warnings';
import './utils/cache'; // Import cache utilities for global debugging

// Enhanced QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 30 minutes by default
      staleTime: 30 * 60 * 1000,
      // Keep in cache for 24 hours
      gcTime: 24 * 60 * 60 * 1000,
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Background refetch on window focus (but data won't be stale for 30min)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
            <App />
        </InternetIdentityProvider>
    </QueryClientProvider>
);

// Register service worker after React app starts
registerSW().then((registration) => {
  if (registration) {
    console.log('Doo Journal PWA ready!')
  }
});
