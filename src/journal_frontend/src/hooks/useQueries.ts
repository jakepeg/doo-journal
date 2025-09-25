import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
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
// Get own homepage
//
export function useGetOwnHomepage() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ profile?: UserProfile; entries: JournalEntry[] }>({
    queryKey: ['ownHomepage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getOwnHomepage();
      return {
        profile: unwrapOpt(result.profile) || undefined,
        entries: result.entries,
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
// Get single journal entry
//
export function useGetJournalEntry(user: Principal, entryId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<JournalEntry | null>({
    queryKey: ['journalEntry', user.toString(), entryId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getJournalEntryById(user, entryId);
      return unwrapOpt(result);
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
// Create entry
//
export function useCreateJournalEntry() {
  const { actor } = useActor();
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
      return await actor.createJournalEntry(
        title,
        content,
        isPublic,
        date,
        imagePath ? [imagePath] : [] // convert to opt text
      );
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
// Update entry
//
export function useUpdateJournalEntry() {
  const { actor } = useActor();
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
      return await actor.updateJournalEntry(
        entryId,
        title,
        content,
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