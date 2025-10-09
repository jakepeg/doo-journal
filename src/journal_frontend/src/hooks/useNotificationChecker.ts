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
      console.log('[Notifications] Checking for pending notifications...');
      const hasPending = await actor.checkPendingNotification();
      console.log('[Notifications] Has pending:', hasPending);
      
      if (hasPending) {
        console.log('[Notifications] Pending notification detected, showing notification...');
        
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
          
          console.log('[Notifications] Service worker notification displayed');
        } else {
          // Fallback for browsers without service worker
          new Notification('Weekly Journal Reminder! 📓', {
            body: 'Hey! Hope you\'re having a nice week. Make sure your journal is up to date!',
            icon: '/icons/192x192.png',
            tag: 'weekly-reminder'
          });
          console.log('[Notifications] Direct notification displayed');
        }
      } else {
        console.log('[Notifications] No pending notifications');
      }
    } catch (error) {
      console.error('[Notifications] Error checking for notifications:', error);
    }
  };

  // Debug functions for testing
  const getDebugInfo = async () => {
    if (!actor) return null;
    try {
      const [timeInfo, debugCheck] = await Promise.all([
        (actor as any).getDebugTimeInfo(),
        (actor as any).debugCheckNotification()
      ]);
      return { timeInfo, debugCheck };
    } catch (error) {
      console.error('[Notifications] Error getting debug info:', error);
      return null;
    }
  };

  const showTestNotification = () => {
    if (!hasPermission) {
      console.warn('[Notifications] No permission for test notification');
      return;
    }

    new Notification('Test Notification 🧪', {
      body: 'This is a test notification to verify notifications are working!',
      icon: '/icons/192x192.png',
      tag: 'test-notification'
    });
    console.log('[Notifications] Test notification displayed');
  };

  useEffect(() => {
    // Check permission status on mount
    if ('Notification' in window) {
      const granted = Notification.permission === 'granted';
      setHasPermission(granted);
      console.log('[Notifications] Initial permission status:', Notification.permission);
    } else {
      console.warn('[Notifications] Browser does not support notifications');
    }
  }, []);

  // Expose debug functions to global window as soon as hook loads
  useEffect(() => {
    (window as any).notificationDebug = {
      checkForNotification,
      getDebugInfo,
      showTestNotification,
      requestPermission,
      hasPermission,
      actorReady: !!actor,
      updateActivity: async () => {
        if (actor) {
          await actor.updateUserActivity();
          console.log('[Debug] Activity updated');
        } else {
          console.warn('[Debug] Actor not ready yet');
        }
      },
      // Basic notification test
      testBasicNotification: () => {
        if (Notification.permission === 'granted') {
          new Notification('Basic Test 🧪', {
            body: 'This is a basic notification test!',
            icon: '/icons/192x192.png',
          });
        } else {
          console.warn('[Debug] Need notification permission first');
        }
      },
      // Force show the journal reminder notification
      forceJournalReminder: () => {
        if (Notification.permission === 'granted') {
          new Notification('Weekly Journal Reminder! 📓', {
            body: 'Hey! Hope you\'re having a nice week. Make sure your journal is up to date!',
            icon: '/icons/192x192.png',
            tag: 'weekly-reminder'
          });
          console.log('[Debug] Forced journal reminder notification');
        } else {
          console.warn('[Debug] Need notification permission first');
        }
      }
    };
    // Debug functions available (reduced logging for performance)
    if (!(window as any).hasNotificationDebug) {
      console.log('[Notifications] Debug functions available at window.notificationDebug');
      (window as any).hasNotificationDebug = true;
    }
    
    return () => {
      // Clean up global debug functions when component unmounts
      if ((window as any).notificationDebug) {
        delete (window as any).notificationDebug;
      }
    };
  }, [checkForNotification, getDebugInfo, showTestNotification, requestPermission, hasPermission, actor]);

  useEffect(() => {
    if (!actor) {
      console.log('[Notifications] Actor not ready yet');
      return;
    }
    
    if (!hasPermission) {
      console.log('[Notifications] No permission granted yet - periodic checking disabled');
      return;
    }

    console.log('[Notifications] Setting up notification checking');

    // Initial check
    checkForNotification();

    // Set up periodic checking
    const checkInterval = setInterval(checkForNotification, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      console.log('[Notifications] Cleaning up notification checker');
      clearInterval(checkInterval);
    };
  }, [actor, hasPermission]);

  return {
    hasPermission,
    requestPermission,
    checkForNotification,
    getDebugInfo,
    showTestNotification
  };
}