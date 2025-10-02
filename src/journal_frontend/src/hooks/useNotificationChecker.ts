import { useEffect, useState } from 'react';
import { useActor } from './useActor';

const NOTIFICATION_CHECK_INTERVAL = 60000; // 1 minute

export function useNotificationChecker() {
  const { actor } = useActor();
  const [hasPermission, setHasPermission] = useState(false);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('[Notifications] User has denied notification permission');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        console.log('[Notifications] Permission granted');
      } else {
        console.log('[Notifications] Permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      return false;
    }
  };

  // Check for pending notifications
  const checkForNotification = async () => {
    if (!actor || !hasPermission) return;

    try {
      const hasPending = await actor.checkPendingNotification();
      
      if (hasPending) {
        console.log('[Notifications] Pending notification detected');
        
        // Show notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          const registration = await navigator.serviceWorker.ready;
          
          await registration.showNotification('Weekly Journal Reminder! 📓', {
            body: 'Hey! Hope you\'re having a nice week. Make sure your journal is up to date!',
            icon: '/icons/192x192.png',
            tag: 'weekly-reminder',
            data: {
              url: '/add-entry'
            }
          } as any); // Use 'as any' to allow service worker notification options
          
          console.log('[Notifications] Notification displayed');
        } else {
          // Fallback for browsers without service worker
          new Notification('Weekly Journal Reminder! 📓', {
            body: 'Hey! Hope you\'re having a nice week. Make sure your journal is up to date!',
            icon: '/icons/192x192.png',
            tag: 'weekly-reminder'
          });
        }
      }
    } catch (error) {
      console.error('[Notifications] Error checking for notifications:', error);
    }
  };

  useEffect(() => {
    // Check permission status on mount
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!actor || !hasPermission) return;

    // Initial check
    checkForNotification();

    // Set up periodic checking
    const checkInterval = setInterval(checkForNotification, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearInterval(checkInterval);
    };
  }, [actor, hasPermission]);

  return {
    hasPermission,
    requestPermission,
    checkForNotification
  };
}