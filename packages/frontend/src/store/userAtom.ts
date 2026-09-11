import { atom } from 'jotai';

export interface CurrentUser {
  id: number;
  role: string;
}

export const currentUserAtom = atom<CurrentUser | null>(null);