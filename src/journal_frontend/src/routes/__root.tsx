import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Suspense, useEffect } from 'react';
import TopNavigation from "@/components/TopNavigation";
import Footer from '../components/Footer';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  console.log('[DEBUG] RootComponent: Component mounting');

  useEffect(() => {
    console.log('[DEBUG] RootComponent: Component mounted');
    return () => {
      console.log('[DEBUG] RootComponent: Component unmounting');
    };
  }, []);

  console.log('[DEBUG] RootComponent: Rendering root component');

  return (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col">

      <TopNavigation />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <main className="flex-1">
          <Outlet />
        </main>
      </Suspense>
      <Footer />
    </div>
  );
}
