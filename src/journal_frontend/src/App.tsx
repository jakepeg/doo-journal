import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { useActivityTracker } from './hooks/useActivityTracker';
import { useNotificationChecker } from './hooks/useNotificationChecker';
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
  
  // Initialize activity tracking and notifications
  useActivityTracker();
  useNotificationChecker();
  
  // Add router context debug logging
  useEffect(() => {
    console.log('[DEBUG] App: Router instance created', {
      routerExists: !!router,
      routeTree: !!routeTree
    });
  }, []);
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        toastOptions={{
          style: {
            minWidth: '300px',
            maxWidth: '400px',
            height: 'auto',
            minHeight: '50px',
            padding: '12px 16px',
          },
          className: 'rounded-lg shadow-lg',
        }}
      />
    </ThemeProvider>
  );
}

export default App;
