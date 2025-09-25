import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Heart } from 'lucide-react';
import DooLogo from './DooLogo';
import { useEffect } from 'react';

export default function LoginScreen() {
  console.log('[DEBUG] LoginScreen: Component mounting');
  
  const { login, loginStatus, loginError } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  // Debug logging for login state
  useEffect(() => {
    console.log('[DEBUG] LoginScreen: Login state changed', {
      loginStatus,
      isLoggingIn,
      loginError: loginError?.message
    });
  }, [loginStatus, isLoggingIn, loginError]);

  const handleLogin = async () => {
    console.log('[DEBUG] LoginScreen: Login button clicked');
    try {
      await login();
      console.log('[DEBUG] LoginScreen: Login initiated successfully');
    } catch (error) {
      console.error('[DEBUG] LoginScreen: Login error:', error);
    }
  };

  console.log('[DEBUG] LoginScreen: Rendering login screen');

  return (
    <div className="flex-1 flex items-center justify-center p-4 pt-16">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <DooLogo width={50} height={40} className="text-purple-500" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              My Journal
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Your magical place to write, dream, and grow! ✨
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-gray-700 font-medium">Ready to start your adventure?</p>
            </div>
            
            {loginError && (
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  Login failed: {loginError.message}
                </p>
              </div>
            )}
            
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Opening your journal...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 fill-current" />
                  <span>Start Writing</span>
                </div>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>Safe, secure, and private</p>
              <p>Your stories are protected with Internet Identity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
