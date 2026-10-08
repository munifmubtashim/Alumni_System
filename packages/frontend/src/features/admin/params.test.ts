import { describe, expect, it } from 'vitest';
import { nextSort, parseAdminParams, toSearchParams, type AdminParams } from './params';

const parse = (query: string) => parseAdminParams(new URLSearchParams(query));
const DEFAULTS: AdminParams = { sort: 'name', order: 'asc', page: 1 };

describe('parseAdminParams', () => {
  it('defaults to name, ascending, page 1 with no query string', () => {
    expect(parse('')).toEqual(DEFAULTS);
  });

  it('reads q, sort, order and page', () => {
    expect(parse('q=%20Ada%20&sort=graduationYear&order=desc&page=3')).toEqual({
      q: 'Ada',
      sort: 'graduationYear',
      order: 'desc',
      page: 3,
    });
  });

  it.each([
    ['an unknown sort', 'sort=department'],
    ['an unknown order', 'order=up'],
    ['a repeated sort', 'sort=name&sort=graduationYear'],
    ['a page of 0', 'page=0'],
    ['a page past the API limit', 'page=10001'],
    ['a non-numeric page', 'page=2a'],
    ['an empty q', 'q=%20%20'],
    ['a q with a control character', 'q=Ada%09Lovelace'],
    ['a q over 100 characters', `q=${'a'.repeat(101)}`],
    ['a repeated q', 'q=Ada&q=Bo'],
  ])('drops %s', (_name, query) => {
    expect(parse(query)).toEqual(DEFAULTS);
  });

  it('keeps a q of exactly 100 characters and the last allowed page', () => {
    expect(parse(`q=${'a'.repeat(100)}&page=10000`)).toEqual({
      ...DEFAULTS,
      q: 'a'.repeat(100),
      page: 10000,
    });
  });
});

describe('toSearchParams', () => {
  it('leaves out the defaults, so the plain URL has no query string', () => {
    expect(toSearchParams(DEFAULTS).toString()).toBe('');
  });

  it('writes what differs from the defaults', () => {
    expect(
      toSearchParams({ q: 'Ada', sort: 'graduationYear', order: 'desc', page: 2 }).toString(),
    ).toBe('q=Ada&sort=graduationYear&order=desc&page=2');
  });

  it('trims q, turns control characters into spaces and drops blank text', () => {
    expect(toSearchParams({ ...DEFAULTS, q: ' Ada\tLovelace ' }).toString()).toBe('q=Ada+Lovelace');
    expect(toSearchParams({ ...DEFAULTS, q: '   ' }).toString()).toBe('');
  });

  it('round-trips through parseAdminParams', () => {
    const params: AdminParams = { q: 'Ada', sort: 'name', order: 'desc', page: 4 };
    expect(parseAdminParams(toSearchParams(params))).toEqual(params);
  });
});

describe('nextSort', () => {
  it('flips the direction of the active column', () => {
    expect(nextSort({ sort: 'name', order: 'asc' }, 'name')).toEqual({
      sort: 'name',
      order: 'desc',
    });
    expect(nextSort({ sort: 'name', order: 'desc' }, 'name')).toEqual({
      sort: 'name',
      order: 'asc',
    });
  });

  it('starts another column ascending', () => {
    expect(nextSort({ sort: 'name', order: 'desc' }, 'graduationYear')).toEqual({
      sort: 'graduationYear',
      order: 'asc',
    });
  });
});
