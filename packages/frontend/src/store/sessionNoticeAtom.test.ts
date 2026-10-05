import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { sessionNoticeAtom } from './sessionNoticeAtom';

describe('sessionNoticeAtom', () => {
  it('starts empty', () => {
    expect(createStore().get(sessionNoticeAtom)).toBeNull();
  });

  it('holds the expired notice until cleared', () => {
    const store = createStore();

    store.set(sessionNoticeAtom, 'expired');
    expect(store.get(sessionNoticeAtom)).toBe('expired');

    store.set(sessionNoticeAtom, null);
    expect(store.get(sessionNoticeAtom)).toBeNull();
  });

  it('is not persisted', () => {
    const store = createStore();

    store.set(sessionNoticeAtom, 'expired');

    expect(window.localStorage.length).toBe(0);
    expect(createStore().get(sessionNoticeAtom)).toBeNull();
  });
});
