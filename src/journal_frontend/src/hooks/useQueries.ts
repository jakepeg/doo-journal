import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useVetKeys } from './useVetKeys';
import { UserProfile, JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

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
  _originalContent?: Uint8Array | number[]; // Keep original for debugging
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
      
      // Decrypt private entries
      const decryptedEntries: DecryptedJournalEntry[] = await Promise.all(
        result.entries.map(async (entry): Promise<DecryptedJournalEntry> => {
          if (entry.contentType === 'encrypted') {
            try {
              const encryptedData = entry.content instanceof Uint8Array 
                ? entry.content 
                : new Uint8Array(entry.content);
              const decryptedContent = await decryptContent(encryptedData);
              return {
                ...entry,
                content: decryptedContent,
                _originalContent: entry.content,
              };
            } catch (error) {
              console.error('Failed to decrypt entry:', error);
              return {
                ...entry,
                content: '[Decryption failed]',
              };
            }
          } else {
            // Plaintext content
            const content = entry.content instanceof Uint8Array
              ? new TextDecoder().decode(entry.content)
              : new TextDecoder().decode(new Uint8Array(entry.content));
            return {
              ...entry,
              content,
            };
          }
        })
      );

      return {
        profile: unwrapOpt(result.profile) || undefined,
        entries: decryptedEntries,
      };
    },
    enabled: !!actor && !actorFetching,
    staleTime: 2 * 60 * 1000,
    retry: 2,
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

      // Decrypt if encrypted and it's the user's own entry
      if (entry.contentType === 'encrypted') {
        try {
          const encryptedData = entry.content instanceof Uint8Array 
            ? entry.content 
            : new Uint8Array(entry.content);
          const decryptedContent = await decryptContent(encryptedData);
          return {
            ...entry,
            content: decryptedContent,
            _originalContent: entry.content,
          } as DecryptedJournalEntry;
        } catch (error) {
          console.error('Failed to decrypt entry:', error);
          return {
            ...entry,
            content: '[Decryption failed]',
          } as DecryptedJournalEntry;
        }
      } else {
        // Plaintext content
        const content = entry.content instanceof Uint8Array
          ? new TextDecoder().decode(entry.content)
          : new TextDecoder().decode(new Uint8Array(entry.content));
        return {
          ...entry,
          content,
        } as DecryptedJournalEntry;
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

      let processedContent: Uint8Array;
      let contentType: string;

      if (isPublic) {
        // Public entries remain unencrypted
        processedContent = new TextEncoder().encode(content);
        contentType = 'plaintext';
      } else {
        // Private entries are encrypted
        processedContent = await encryptContent(content);
        contentType = 'encrypted';
      }

      console.log('[DEBUG] Creating entry:', {
        title,
        contentLength: processedContent.length,
        contentType,
        isPublic,
        contentPreview: processedContent.slice(0, 20),
        processedContentType: processedContent.constructor.name,
        isUint8Array: processedContent instanceof Uint8Array
      });

      // Try different approaches for blob serialization
      console.log('[DEBUG] Original processedContent:', processedContent);
      
      // Approach 1: Array.from
      const blobData = Array.from(processedContent);
      console.log('[DEBUG] Blob data as array:', {
        length: blobData.length,
        first10: blobData.slice(0, 10),
        isArray: Array.isArray(blobData),
        allNumbers: blobData.every(x => typeof x === 'number' && x >= 0 && x <= 255)
      });

      // Approach 2: Try direct Uint8Array (fallback)
      // const blobData = processedContent;

      const result = await actor.createJournalEntry(
        title,
        blobData, // Send as number array for Candid serialization
        contentType,
        isPublic,
        date,
        imagePath ? [imagePath] : [] // convert to opt text
      );
      
      console.log('[DEBUG] Backend response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['allJournalEntries'] });
      toast.success('Journal entry created!');
    },
    onError: (error: any) => {
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

      let processedContent: Uint8Array;
      let contentType: string;

      if (isPublic) {
        // Public entries remain unencrypted
        processedContent = new TextEncoder().encode(content);
        contentType = 'plaintext';
      } else {
        // Private entries are encrypted
        processedContent = await encryptContent(content);
        contentType = 'encrypted';
      }

      console.log('[DEBUG] Updating entry:', {
        entryId,
        title,
        contentLength: processedContent.length,
        contentType,
        isPublic,
        contentPreview: processedContent.slice(0, 20)
      });

      // Convert to proper format for Candid
      const blobData = Array.from(processedContent);
      
      return await actor.updateJournalEntry(
        entryId,
        title,
        blobData, // Send as number array for Candid serialization
        contentType,
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