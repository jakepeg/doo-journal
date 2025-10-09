import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { toast } from 'sonner';
import DooLogo from './DooLogo';
import { Link, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';

export default function TopNavigation() {
  const handleLogout = async () => {
    try {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
      setTimeout(() => {
        navigate({ to: '/' });
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled 
        ? 'backdrop-blur-md' 
        : 'backdrop-blur-sm'
    }`}>
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer">
            <DooLogo width={40} height={40} />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Doo Journal
              </h1>
              <span className="text-xs text-gray-500">Journal Today: Memories Forever</span>
            </div>
          </Link>

          {/* Actions */}
          <div className="ml-auto">
            {isAuthenticated ? (
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                Logout
              </Button>
            ) : (
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                {isLoggingIn ? 'Starting...' : 'Login'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
