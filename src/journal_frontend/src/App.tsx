import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { useEffect } from 'react';

// Create a new router instance
const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  console.log('[DEBUG] App: Component mounting');
  
  // Add router context debug logging
  useEffect(() => {
    console.log('[DEBUG] App: Router instance created', {
      routerExists: !!router,
      routeTree: !!routeTree
    });
  }, []);
  
  console.log('[DEBUG] App: Rendering with ThemeProvider and RouterProvider');
  console.log("TEST ENV:", import.meta.env.VITE_TEST_ENV);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}

export default App;
