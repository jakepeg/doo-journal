import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setShowOfflineAlert(true);
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      // Show brief "back online" message
      setShowOfflineAlert(true);
      setTimeout(() => {
        setShowOfflineAlert(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  if (!showOfflineAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className={`border-0 shadow-lg ${
        isOnline 
          ? 'bg-green-50 text-green-800 border-green-200' 
          : 'bg-orange-50 text-orange-800 border-orange-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-600" />
          )}
          <AlertDescription className="font-medium">
            {isOnline ? (
              'Back online! Your journal is syncing...'
            ) : (
              'You\'re offline. Don\'t worry, you can still view your cached journal entries!'
            )}
          </AlertDescription>
        </div>
        {!isOnline && (
          <AlertDescription className="mt-2 text-sm opacity-80">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            New entries will be saved when you're back online.
          </AlertDescription>
        )}
      </Alert>
    </div>
  );
}
