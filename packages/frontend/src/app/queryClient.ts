import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const STALE_TIME_MS = 30_000;
const MAX_QUERY_RETRIES = 2;

/** True for an axios error whose response status is 4xx (client error: retrying won't help). */
export function is4xxError(err: unknown): boolean {
  if (!isAxiosError(err) || err.response === undefined) return false;
  const { status } = err.response;
  return status >= 400 && status < 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => failureCount < MAX_QUERY_RETRIES && !is4xxError(error),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
