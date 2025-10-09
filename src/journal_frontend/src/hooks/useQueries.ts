import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useActor } from './useActor';
import { useVetKeys } from './useVetKeys';
import { UserProfile, JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { debug } from '../utils/debug';

//
// Utility: unwrap Candid opt types ([] | [T]) → T | null/undefined
//
function unwrapOpt<T>(opt: [] | [T] | null | undefined): T | null {
  if (!opt || opt.length === 0) return null;
  return opt[0];
}

//
// Get current user profile
//
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null, Error>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getCallerUserProfile();
      return unwrapOpt(result);
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });

  const isActuallyLoading =
    !actor ||
    actorFetching ||
    (!!actor && !actorFetching && query.isLoading && !query.isFetched);

  const isActuallyFetched =
    !!actor && !actorFetching && (query.isFetched || query.isError);

  return {
    ...query,
    isLoading: isActuallyLoading,
    isFetched: isActuallyFetched,
  };
}

//
// Save current user profile
//
export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['ownHomepage'] });
      toast.success('Profile saved successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to save profile: ' + error.message);
    },
  });
}

//
// Decrypted journal entry type for frontend use
//
export type DecryptedJournalEntry = Omit<JournalEntry, 'content'> & {
  content: string; // Decrypted content as string
};

//
// Get own homepage with decryption
//
export function useGetOwnHomepage() {
  const { actor, isFetching: actorFetching } = useActor();
  const { decryptContent } = useVetKeys();

  return useQuery<{ profile?: UserProfile; entries: DecryptedJournalEntry[] }>({
    queryKey: ['ownHomepage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getOwnHomepage();
      
      // Process entries - only decrypt if private, handle large content for public
      const decryptedEntries = await Promise.all(
        result.entries.map(async (entry: any) => {
          // Only decrypt private entries - public entries are stored as plain text
          if (entry.isPublic) {
            let publicContent = entry.content;
            
            // Handle large content markers
            if (publicContent.startsWith('LARGE_CONTENT:')) {
              try {
                const encoded = publicContent.replace('LARGE_CONTENT:', '');
                let base = encoded.trim();
                
                // Basic percent-decode if needed
                if (/%[0-9A-Fa-f]{2}/.test(base)) {
                  try { 
                    base = decodeURIComponent(base); 
                  } catch { /* ignore */ }
                }
                
                // Convert URL-safe base64 and clean
                base = base.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/=]/g, '');
                
                // Fix padding
                const paddingNeeded = 4 - (base.length % 4);
                if (paddingNeeded !== 4) {
                  base += '='.repeat(paddingNeeded);
                }
                
                // Decode base64
                const bin = atob(base);
                
                // Try URI decode
                try {
                  publicContent = decodeURIComponent(bin);
                } catch {
                  publicContent = bin;
                }
              } catch (error) {
                console.warn('Failed to decode large content:', error);
                publicContent = '[Content could not be decoded]';
              }
            }
            
            return {
              ...entry,
              content: publicContent,
            };
          } else {
            // Private entries need decryption
            try {
              const decryptedContent = await decryptContent(entry.content);
              return {
                ...entry,
                content: decryptedContent,
              };
            } catch (error) {
              console.error('Failed to decrypt entry:', error);
              return {
                ...entry,
                content: '[Decryption failed]',
              };
            }
          }
        })
      );

      return {
        profile: result.profile?.[0] || undefined,
        entries: decryptedEntries,
      };
    },
    enabled: !!actor && !actorFetching,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

//
// Get another user's homepage
//
export function useGetUserHomepage(user: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ profile?: UserProfile; publicEntries: JournalEntry[] }>({
    queryKey: ['userHomepage', user.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getUserHomepage(user);
      return {
        profile: unwrapOpt(result.profile) || undefined,
        publicEntries: result.publicEntries,
      };
    },
    enabled: !!actor && !!user,
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });
}

//
// Get single journal entry with decryption
//
export function useGetJournalEntry(user: Principal, entryId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { decryptContent } = useVetKeys();

  return useQuery<DecryptedJournalEntry | null>({
    queryKey: ['journalEntry', user.toString(), entryId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getJournalEntryById(user, entryId);
      const entry = unwrapOpt(result);
      
      if (!entry) return null;

      // Only decrypt private entries - public entries are stored as plain text
      if (entry.isPublic) {
        // Handle large content for public entries (same logic as PublicHomepage)
        let content = entry.content;
        if (content.startsWith('LARGE_CONTENT:')) {
          const encoded = content.replace('LARGE_CONTENT:', '');
          try {
            let base = encoded.trim();
            
            // If percent-encoded, decode once to restore raw base64
            if (/%[0-9A-Fa-f]{2}/.test(base)) {
              try { base = decodeURIComponent(base); } catch {}
            }
            
            // Convert URL-safe variants
            base = base.replace(/-/g, '+').replace(/_/g, '/');
            // Strip anything not base64 set
            base = base.replace(/[^A-Za-z0-9+/=]/g, '');
            // Fix padding (length must be multiple of 4)
            if (base.length % 4 !== 0) {
              base = base.padEnd(base.length + (4 - (base.length % 4)), '=');
            }
            
            const bin = atob(base);
            // Try URI component decode (content was encoded with encodeURIComponent)
            try {
              const decoded = decodeURIComponent(bin);
              // Extra safety: make sure we didn't corrupt image data URLs during decoding
              if (bin.includes('data:image/') && !decoded.includes('data:image/')) {
                console.warn('Detected potential image corruption during URI decode, using raw binary');
                content = bin;
              } else {
                content = decoded;
              }
            } catch {
              content = bin; // return raw if not URI encoded
            }
          } catch (e) {
            console.error('Failed to decode large public content:', e);
            content = '[Content could not be decoded]';
          }
        }
        
        return {
          ...entry,
          content: content,
          _originalContent: undefined,
        } as DecryptedJournalEntry;
      } else {
        // Private entries need decryption
        try {
          const decryptedContent = await decryptContent(entry.content);
          return {
            ...entry,
            content: decryptedContent,
            _originalContent: entry.content,
          } as DecryptedJournalEntry;
        } catch (error) {
          console.error('Failed to decrypt private entry:', error);
          return {
            ...entry,
            content: '[Decryption failed]',
            _originalContent: entry.content,
          } as DecryptedJournalEntry;
        }
      }
    },
    enabled: !!actor && !!user && !!entryId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

//
// Get public journal entry with profile
//
export function useGetPublicJournalEntryWithProfile(
  user: Principal,
  entryId: string
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ entry: JournalEntry; profile: UserProfile } | null>({
    queryKey: ['publicJournalEntryWithProfile', user.toString(), entryId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getPublicJournalEntryWithProfile(user, entryId);

      // Unwrap [] | [T] → T | null
      if (!result || result.length === 0) return null;
      return result[0];
    },
    enabled: !!actor && !!user && !!entryId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}


//
// Create entry with encryption support
//
export function useCreateJournalEntry() {
  const { actor } = useActor();
  const { encryptContent } = useVetKeys();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      isPublic,
      date,
      imagePath,
    }: {
      title: string;
      content: string;
      isPublic: boolean;
      date: bigint;
      imagePath: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');

      // Only encrypt private entries - public entries are stored as plain text
      let processedContent: string;
      if (isPublic) {
        debug.log('Storing public entry as plain text:', {
          title,
          isPublic,
          originalLength: content.length
        });
        processedContent = content; // Store public entries as plain text
      } else {
        debug.log('Encrypting private entry:', {
          title,
          isPublic,
          originalContent: content.substring(0, 50) + '...',
          originalLength: content.length
        });
        
        processedContent = await encryptContent(content);
        
        debug.log('Private entry encrypted:', {
          title,
          encryptedLength: processedContent.length
        });
      }

      const result = await actor.createJournalEntry(
        title,
        processedContent, // Send as encrypted string
        isPublic,
        date,
        imagePath ? [imagePath] : [] // convert to opt text
      );
      
      // Return the entry data for optimistic update
      return {
        entryId: result,
        originalData: { title, content, isPublic, date, imagePath }
      };
    },
    // Add optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['ownHomepage'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['ownHomepage']);

      // Optimistically update to the new value
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: DecryptedJournalEntry = {
        id: tempId,
        title: variables.title,
        content: variables.content, // Use plain content for immediate display
        isPublic: variables.isPublic,
        timestamp: BigInt(Date.now() * 1000000), // nanoseconds
        date: variables.date,
        imagePath: variables.imagePath ? [variables.imagePath] : []
      };

      queryClient.setQueryData(['ownHomepage'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: [optimisticEntry, ...old.entries]
        };
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onSuccess: (data) => {
      // Use more efficient refetch instead of full invalidation
      queryClient.refetchQueries({ 
        queryKey: ['ownHomepage'],
        type: 'active' // Only refetch if query is currently active
      });
      
      // Don't invalidate allJournalEntries immediately to avoid cascade
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['allJournalEntries'] });
      }, 1000);
      
      toast.success('Journal entry created!');
    },
    onError: (error: any, variables, context) => {
      // Revert the optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['ownHomepage'], context.previousData);
      }
      toast.error('Failed to create entry: ' + error.message);
    },
  });
}

//
// Update entry with encryption support
//
export function useUpdateJournalEntry() {
  const { actor } = useActor();
  const { encryptContent } = useVetKeys();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      title,
      content,
      isPublic,
      date,
      imagePath,
    }: {
      entryId: string;
      title: string;
      content: string;
      isPublic: boolean;
      date: bigint;
      imagePath: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');

      // Only encrypt private entries - public entries are stored as plain text  
      let processedContent: string;
      if (isPublic) {
        console.log('[DEBUG] Updating public entry as plain text:', {
          entryId,
          title,
          contentLength: content.length,
          isPublic
        });
        processedContent = content; // Store public entries as plain text
      } else {
        console.log('[DEBUG] Encrypting private entry:', {
          entryId,
          title,
          originalLength: content.length,
          isPublic
        });
        
        processedContent = await encryptContent(content);
        
        console.log('[DEBUG] Private entry encrypted:', {
          entryId,
          title,
          encryptedLength: processedContent.length
        });
      }
      
      return await actor.updateJournalEntry(
        entryId,
        title,
        processedContent, // Send as encrypted string
        isPublic,
        date,
        imagePath ? [imagePath] : [] // convert to opt text
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['allJournalEntries'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntry'] });
      toast.success('Journal entry updated!');
    },
    onError: (error: any) => {
      toast.error('Failed to update entry: ' + error.message);
    },
  });
}

//
// Delete entry
//
export function useDeleteJournalEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!actor) throw new Error('Actor not available');
      return await actor.deleteJournalEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['allJournalEntries'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntry'] });
      toast.success('Journal entry deleted!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete entry: ' + error.message);
    },
  });
}

//
// Get all entries
//
export function useGetAllJournalEntries() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<JournalEntry[]>({
    queryKey: ['allJournalEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return await actor.getAllJournalEntries();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}