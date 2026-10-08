import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { createQueryClient } from './queryClient';

type JotaiStore = ReturnType<typeof createStore>;

let defaultQueryClient: QueryClient | undefined;
let defaultStore: JotaiStore | undefined;

// Created on first use, then shared for the life of the page.
function getDefaultQueryClient(): QueryClient {
  defaultQueryClient ??= createQueryClient();
  return defaultQueryClient;
}

function getDefaultStore(): JotaiStore {
  defaultStore ??= createStore();
  return defaultStore;
}

interface AppProvidersProps {
  children: ReactNode;
  /** Inject a fresh client in tests; the app uses the shared default. */
  queryClient?: QueryClient;
  /** Inject a fresh Jotai store in tests; the app uses the shared default. */
  store?: JotaiStore;
}

export function AppProviders({ children, queryClient, store }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient ?? getDefaultQueryClient()}>
      <JotaiProvider store={store ?? getDefaultStore()}>{children}</JotaiProvider>
    </QueryClientProvider>
  );
}
