import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, showInstallPrompt, dismissInstallPrompt } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    await showInstallPrompt();
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsDismissed(true);
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-0 shadow-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white max-w-sm mx-auto md:left-auto md:right-4 md:max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Install My Journal
              </CardTitle>
              <CardDescription className="text-purple-100">
                Get the full app experience!
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-purple-100">
            <Monitor className="w-4 h-4" />
            <span>Works offline • Faster loading • App-like experience</span>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-white text-purple-600 hover:bg-purple-50 font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
