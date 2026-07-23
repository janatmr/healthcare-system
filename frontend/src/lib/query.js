import {
  QueryClient,
  useMutation as useMutationBase,
  useQuery as useQueryBase,
} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
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
