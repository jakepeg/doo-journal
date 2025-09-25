import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogOut, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import DooLogo from './DooLogo';
import { Link } from '@tanstack/react-router';

export default function TopNavigation() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 max-w-[1024px]">
        <div className="flex items-center justify-between">
          {/* Logo / Title links to `/` */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer">
            <DooLogo width={40} height={40} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Doo Journal
            </h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoggingIn ? 'Starting...' : 'Login'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
