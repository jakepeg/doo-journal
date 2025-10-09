import { useInternetIdentity } from "./useInternetIdentity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { _SERVICE as backendInterface } from "../../../declarations/journal_backend/journal_backend.did";

import { createActorWithConfig } from "../config";

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const actor = await createActorWithConfig(
        identity
          ? {
              agentOptions: {
                identity,
                host: import.meta.env.VITE_IC_HOST || "http://127.0.0.1:4943",
              },
            }
          : {}
      );

      return actor;
    },
    staleTime: Infinity,
    enabled: true,
  });

  // Remove automatic refetch - this was causing performance issues
  // useEffect(() => {
  //   if (actorQuery.data) {
  //     queryClient.invalidateQueries({
  //       predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
  //     });
  //     queryClient.refetchQueries({
  //       predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
  //     });
  //   }
  // }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
