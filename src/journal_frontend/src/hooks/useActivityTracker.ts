import { useEffect } from 'react';
import { useActor } from './useActor';

const ACTIVITY_HEARTBEAT_INTERVAL = 60000; // 1 minute

export function useActivityTracker() {
  const { actor } = useActor();

  useEffect(() => {
    if (!actor) return;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await actor.updateUserActivity();
        console.log('[ActivityTracker] Heartbeat sent');
      } catch (error) {
        console.error('[ActivityTracker] Failed to send heartbeat:', error);
      }
    };

    // Send heartbeat when app becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // Send heartbeat when user interacts with the page
    const handleUserActivity = () => {
      sendHeartbeat();
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up periodic heartbeat when page is visible
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    }, ACTIVITY_HEARTBEAT_INTERVAL);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for user activity (optional - for more responsive tracking)
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let lastActivity = Date.now();
    
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 30000) { // Throttle to once per 30 seconds
        lastActivity = now;
        handleUserActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity);
      });
    };
  }, [actor]);
}