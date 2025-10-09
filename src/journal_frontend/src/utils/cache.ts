/**
 * Cache management utilities for Doo Journal
 */

export const CACHE_KEYS = {
  PROFILE: 'doo_journal_profile_cache',
  PROFILE_TIMESTAMP: 'doo_journal_profile_cache_timestamp',
  ENTRIES: 'doo_journal_entries_cache',
  ENTRIES_TIMESTAMP: 'doo_journal_entries_cache_timestamp',
} as const;

/**
 * Clear all localStorage caches
 */
export function clearAllCache() {
  try {
    localStorage.removeItem(CACHE_KEYS.PROFILE);
    localStorage.removeItem(CACHE_KEYS.PROFILE_TIMESTAMP);
    localStorage.removeItem(CACHE_KEYS.ENTRIES);
    localStorage.removeItem(CACHE_KEYS.ENTRIES_TIMESTAMP);
    console.log('🗑️ Cleared all localStorage caches');
    return true;
  } catch (e) {
    console.warn('Failed to clear cache:', e);
    return false;
  }
}

/**
 * Clear only profile cache
 */
export function clearProfileCache() {
  try {
    localStorage.removeItem(CACHE_KEYS.PROFILE);
    localStorage.removeItem(CACHE_KEYS.PROFILE_TIMESTAMP);
    console.log('🗑️ Cleared profile cache');
    return true;
  } catch (e) {
    console.warn('Failed to clear profile cache:', e);
    return false;
  }
}

/**
 * Clear only entries cache
 */
export function clearEntriesCache() {
  try {
    localStorage.removeItem(CACHE_KEYS.ENTRIES);
    localStorage.removeItem(CACHE_KEYS.ENTRIES_TIMESTAMP);
    console.log('🗑️ Cleared entries cache');
    return true;
  } catch (e) {
    console.warn('Failed to clear entries cache:', e);
    return false;
  }
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo() {
  const profile = localStorage.getItem(CACHE_KEYS.PROFILE);
  const profileTimestamp = localStorage.getItem(CACHE_KEYS.PROFILE_TIMESTAMP);
  const entries = localStorage.getItem(CACHE_KEYS.ENTRIES);
  const entriesTimestamp = localStorage.getItem(CACHE_KEYS.ENTRIES_TIMESTAMP);

  const now = Date.now();
  
  return {
    profile: {
      cached: !!profile,
      age: profileTimestamp ? Math.round((now - parseInt(profileTimestamp)) / 1000) : null,
      size: profile ? profile.length : 0,
    },
    entries: {
      cached: !!entries,
      age: entriesTimestamp ? Math.round((now - parseInt(entriesTimestamp)) / 1000) : null,
      size: entries ? entries.length : 0,
      count: entries ? JSON.parse(entries).length : 0,
    }
  };
}

/**
 * Add cache info to global window object for debugging
 */
if (typeof window !== 'undefined') {
  (window as any).dooJournalCache = {
    clear: clearAllCache,
    clearProfile: clearProfileCache,
    clearEntries: clearEntriesCache,
    info: getCacheInfo,
  };
}