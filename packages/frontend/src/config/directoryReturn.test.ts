import { describe, expect, it } from 'vitest';
import { DIRECTORY_PATH, directoryReturnPath, directoryReturnState } from './directoryReturn';

describe('directoryReturnState', () => {
  it('wraps the search string', () => {
    expect(directoryReturnState('?q=ann')).toEqual({ directorySearch: '?q=ann' });
  });

  it('round-trips through directoryReturnPath', () => {
    expect(directoryReturnPath(directoryReturnState('?q=ann&page=2'))).toBe(
      '/directory?q=ann&page=2',
    );
  });
});

describe('directoryReturnPath', () => {
  it('is /directory', () => {
    expect(DIRECTORY_PATH).toBe('/directory');
  });

  it('restores a stored search exactly', () => {
    expect(directoryReturnPath({ directorySearch: '?q=ann&page=2' })).toBe(
      '/directory?q=ann&page=2',
    );
  });

  it('gives /directory for an empty search', () => {
    expect(directoryReturnPath({ directorySearch: '' })).toBe('/directory');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', '?q=ann'],
    ['an object without the key', { other: '?q=ann' }],
    ['a non-string value', { directorySearch: 5 }],
    ['a null value', { directorySearch: null }],
    ['a value not starting with ?', { directorySearch: 'x' }],
    ['a path', { directorySearch: '/admin' }],
    ['a value with a hash', { directorySearch: '?a#b' }],
  ])('gives /directory for %s', (_label, state) => {
    expect(directoryReturnPath(state)).toBe('/directory');
  });
});
