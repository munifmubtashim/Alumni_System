import { atom } from 'jotai';

export type SessionNotice = 'expired';

/**
 * One-shot message for the login page: 'expired' after a 401 ended the
 * session (set by SessionBridge). Not persisted, so a reload drops it; the
 * login page clears it on unmount and a successful login clears it too.
 */
export const sessionNoticeAtom = atom<SessionNotice | null>(null);
