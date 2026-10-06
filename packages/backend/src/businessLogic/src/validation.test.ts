import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE, parseAlumniSearch } from './validation.js';
import { expectAppError } from '../../test/expectAppError';

describe('parseAlumniSearch (GET /api/alumni query)', () => {
  it('applies the defaults when nothing is given', () => {
    expect(parseAlumniSearch({})).toEqual({ filters: {}, page: 1, pageSize: DEFAULT_PAGE_SIZE });
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });

  it('returns every filter, trimmed, with graduationYear as a number', () => {
    expect(
      parseAlumniSearch({
        q: '  ada  ',
        department: ' Computer Science ',
        university: ' Dhaka University ',
        graduationYear: ' 2020 ',
        page: '3',
        pageSize: '10',
      }),
    ).toEqual({
      filters: { q: 'ada', department: 'Computer Science', university: 'Dhaka University', graduationYear: 2020 },
      page: 3,
      pageSize: 10,
    });
  });

  it.each(['', '   '])('ignores an empty q, department, university and graduationYear (%j)', (blank) => {
    expect(
      parseAlumniSearch({ q: blank, department: blank, university: blank, graduationYear: blank }).filters,
    ).toEqual({});
  });

  it('ignores unknown keys, including field', () => {
    expect(parseAlumniSearch({ field: 'password', sort: 'name', q: 'x' })).toEqual({
      filters: { q: 'x' },
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  describe('length limits', () => {
    it.each([
      ['q', 100],
      ['department', 100],
      ['university', 150],
    ])('accepts %s at %i characters and rejects one more', async (param, max) => {
      expect(parseAlumniSearch({ [param]: 'a'.repeat(max) }).filters).toEqual({ [param]: 'a'.repeat(max) });
      await expectAppError(() => parseAlumniSearch({ [param]: 'a'.repeat(max + 1) }), 400);
    });

    it('measures q after trimming', () => {
      expect(parseAlumniSearch({ q: `  ${'a'.repeat(100)}  ` }).filters.q).toHaveLength(100);
    });
  });

  describe('graduationYear', () => {
    const maxYear = new Date().getFullYear() + 10;

    it.each(['1900', String(maxYear)])('accepts %s', (year) => {
      expect(parseAlumniSearch({ graduationYear: year }).filters.graduationYear).toBe(Number(year));
    });

    it.each(['1899', String(maxYear + 1), '20', '20201', '2020.0', '2o20', '-2020', 'abcd'])(
      'rejects %j',
      async (year) => {
        await expectAppError(() => parseAlumniSearch({ graduationYear: year }), 400);
      },
    );
  });

  describe('page and pageSize', () => {
    // `?page=` arrives as '' and `?pageSize=%20` as ' '.
    it.each(['', ' ', ' \t '])('treats an empty page/pageSize (%j) as absent', (blank) => {
      expect(parseAlumniSearch({ page: blank, pageSize: blank })).toEqual({
        filters: {},
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it('accepts the bounds', () => {
      expect(parseAlumniSearch({ page: '1', pageSize: '1' })).toMatchObject({ page: 1, pageSize: 1 });
      expect(parseAlumniSearch({ page: String(MAX_PAGE), pageSize: String(MAX_PAGE_SIZE) })).toMatchObject({
        page: 10000,
        pageSize: 100,
      });
    });

    it.each(['0', '-1', '1.5', 'abc', '1e2', '0x10', '10001'])('rejects page %j', async (page) => {
      const error = await expectAppError(() => parseAlumniSearch({ page }), 400);
      expect(error.message).toBe('page must be a whole number from 1 to 10000');
    });

    it.each(['0', '-1', '1.5', 'abc', '101'])('rejects pageSize %j', async (pageSize) => {
      const error = await expectAppError(() => parseAlumniSearch({ pageSize }), 400);
      expect(error.message).toBe('pageSize must be a whole number from 1 to 100');
    });
  });

  describe('repeated or nested parameters', () => {
    it.each(['q', 'department', 'university', 'graduationYear', 'page', 'pageSize'])(
      'rejects an array or object for %s',
      async (param) => {
        const asArray = await expectAppError(() => parseAlumniSearch({ [param]: ['a', 'b'] }), 400);
        expect(asArray.message).toBe(`${param} must be a single value`);
        const asObject = await expectAppError(() => parseAlumniSearch({ [param]: { x: '1' } }), 400);
        expect(asObject.message).toBe(`${param} must be a single value`);
      },
    );

    it('ignores an array in an unknown key', () => {
      expect(parseAlumniSearch({ field: ['a', 'b'] }).filters).toEqual({});
    });
  });
});
