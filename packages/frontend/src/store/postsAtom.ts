import { atom } from 'jotai';
import type { Post } from '@alumni/shared';

export const postsAtom = atom<Post[]>([]);
export const postsLoadingAtom = atom<boolean>(true);
export const postsHasMoreAtom = atom<boolean>(true);