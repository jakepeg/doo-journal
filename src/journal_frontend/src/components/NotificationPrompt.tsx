import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bell, X, AlertCircle } from 'lucide-react';
import { useNotificationChecker } from '../hooks/useNotificationChecker';

export default function NotificationPrompt() {
  const { hasPermission, requestPermission } = useNotificationChecker();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Show prompt after user has interacted with the app for a bit
    const timer = setTimeout(() => {
      if (!hasPermission && 'Notification' in window && Notification.permission === 'default') {
        setIsVisible(true);
      }
    }, 3000); // Wait 3 seconds after app loads

    return () => clearTimeout(timer);
  }, [hasPermission]);

  const handleEnableNotifications = async () => {
    setHasInteracted(true);
    const granted = await requestPermission();
    
    if (granted) {
      setIsVisible(false);
      
      // Show a test notification to confirm it's working
      setTimeout(() => {
        new Notification('🎉 Notifications Enabled!', {
          body: 'Great! We\'ll remind you to update your journal.',
          icon: '/icons/192x192.png',
        });
      }, 500);
    } else {
      // If denied, show instructions for manual enabling
      alert(`
📱 To enable notifications manually:

1. Click the 🔒 lock icon next to the web address
2. Find "Notifications" and change it to "Allow"
3. Refresh the page

This helps us remind you to write in your journal! 📓
      `.trim());
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem('notificationPromptDismissed', 'true');
  };

  // Don't show if already has permission, not supported, or dismissed
  if (!isVisible || hasPermission || !('Notification' in window) || 
      sessionStorage.getItem('notificationPromptDismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-purple-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Get Reminders! 📓</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            We can remind you to write in your journal each week!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
            <span>
              Don't worry - we'll only send helpful reminders, not spam! 
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleEnableNotifications}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={hasInteracted}
            >
              <Bell className="w-4 h-4 mr-2 text-white" />
              {hasInteracted ? 'Please check browser...' : 'Enable Reminders'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="px-3"
            >
              Not now
            </Button>
          </div>

          {hasInteracted && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>If nothing happened:</strong> Look for a 🔒 or 🔔 icon next to the web address and click "Allow"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}