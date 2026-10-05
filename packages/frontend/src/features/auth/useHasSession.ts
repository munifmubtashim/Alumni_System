import { useSyncExternalStore } from 'react';
import { getLiveToken, subscribe } from '@/services/authToken';

/**
 * The stored token if it is present and not expired, else null. Re-renders on
 * login, logout, a 401 logout and another tab's change (ADR-03). The snapshot
 * is a pure read; expired-token cleanup happens in SessionBridge.
 */
export function useLiveToken(): string | null {
  return useSyncExternalStore(subscribe, getLiveToken);
}

/** True while a live (unexpired) token is stored. */
export function useHasSession(): boolean {
  return useLiveToken() !== null;
}
