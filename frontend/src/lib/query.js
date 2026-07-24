import {
  QueryClient,
  useMutation as useMutationBase,
  useQuery as useQueryBase,
} from '@tanstack/react-query';

/** Cross-user sync interval (Phase 13). Spec allows polling as an alternative to WebSockets. */
export const SYNC_REFETCH_INTERVAL_MS = 15_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      // Keep lists/stats fresh across concurrent users without a manual refresh
      refetchInterval: SYNC_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  },
});

/** Shared client avoids duplicated QueryClient React context in production builds. */
export function useQuery(options) {
  return useQueryBase(options, queryClient);
}

export function useMutation(options) {
  return useMutationBase(options, queryClient);
}

export function useQueryClient() {
  return queryClient;
}
