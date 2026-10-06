import { describe, expect, it } from 'vitest';
import {
  DEPARTMENT_MAX_LENGTH,
  isValidGraduationYear,
  parseDirectoryParams,
  Q_MAX_LENGTH,
  toSearchParams,
  UNIVERSITY_MAX_LENGTH,
  type DirectoryParams,
} from './params';

const NOW = new Date(2026, 9, 6);

function parse(query: string): DirectoryParams {
  return parseDirectoryParams(new URLSearchParams(query), NOW);
}

describe('parseDirectoryParams', () => {
  it('reads every valid value', () => {
    expect(
      parse('q=Ada&department=Computer+Science&university=MIT&graduationYear=2017&page=3'),
    ).toEqual({
      q: 'Ada',
      department: 'Computer Science',
      university: 'MIT',
      graduationYear: 2017,
      page: 3,
    });
  });

  it('defaults to page 1 with no filters for an empty query string', () => {
    expect(parse('')).toEqual({ page: 1 });
  });

  it('trims text and drops empty or blank values', () => {
    expect(parse('q=%20%20Ada%20&department=&university=%20%20')).toEqual({ q: 'Ada', page: 1 });
  });

  it.each(['abc', '0', '-1', '10001', '1.5', '', '1e3', ' '])('ignores page=%j', (page) => {
    expect(parse(`page=${encodeURIComponent(page)}`).page).toBe(1);
  });

  it('accepts the page limits', () => {
    expect(parse('page=1').page).toBe(1);
    expect(parse('page=10000').page).toBe(10000);
  });

  it.each(['20', 'abcd', '1899', '2037', '20170', '2017.0', ''])(
    'drops graduationYear=%j',
    (year) => {
      expect(parse(`graduationYear=${year}`)).toEqual({ page: 1 });
    },
  );

  it('accepts years from 1900 to the current year + 10', () => {
    expect(parse('graduationYear=1900').graduationYear).toBe(1900);
    expect(parse('graduationYear=2036').graduationYear).toBe(2036);
  });

  it.each([
    ['q', Q_MAX_LENGTH],
    ['department', DEPARTMENT_MAX_LENGTH],
    ['university', UNIVERSITY_MAX_LENGTH],
  ])('drops %s over %i characters but keeps it at the limit', (key, max) => {
    expect(parse(`${key}=${'a'.repeat(max + 1)}`)).toEqual({ page: 1 });
    expect(parse(`${key}=${'a'.repeat(max)}`)).toEqual({ [key]: 'a'.repeat(max), page: 1 });
  });

  it('measures the length after trimming', () => {
    expect(parse(`q=%20${'a'.repeat(Q_MAX_LENGTH)}%20`).q).toBe('a'.repeat(Q_MAX_LENGTH));
  });

  it.each(['%00', '%01', '%0A', '%1F', '%7F'])(
    'drops text containing the control character %s',
    (c) => {
      expect(parse(`q=Ada${c}&department=CS${c}&university=MIT${c}`)).toEqual({ page: 1 });
    },
  );

  it('uses none of the values of a repeated param', () => {
    expect(
      parse(
        'q=a&q=b&department=x&department=y&university=u&university=v&graduationYear=2017&graduationYear=2018&page=2&page=3',
      ),
    ).toEqual({ page: 1 });
  });

  it('ignores unknown params', () => {
    expect(parse('pageSize=50&foo=bar&q=Ada')).toEqual({ q: 'Ada', page: 1 });
  });
});

describe('isValidGraduationYear', () => {
  it('checks 4 digits within range', () => {
    expect(isValidGraduationYear('2017', NOW)).toBe(true);
    expect(isValidGraduationYear(' 2017 ', NOW)).toBe(true);
    expect(isValidGraduationYear('201', NOW)).toBe(false);
    expect(isValidGraduationYear('20a7', NOW)).toBe(false);
    expect(isValidGraduationYear('1899', NOW)).toBe(false);
    expect(isValidGraduationYear('2037', NOW)).toBe(false);
  });
});

describe('toSearchParams', () => {
  it('leaves out empty values and page 1', () => {
    expect(toSearchParams({ page: 1 }).toString()).toBe('');
    expect(toSearchParams({ q: '  ', department: '', page: 1 }).toString()).toBe('');
  });

  it('writes every set value', () => {
    expect(
      toSearchParams({
        q: 'Ada Lovelace',
        department: 'Computer Science',
        university: 'MIT',
        graduationYear: 2017,
        page: 4,
      }).toString(),
    ).toBe('q=Ada+Lovelace&department=Computer+Science&university=MIT&graduationYear=2017&page=4');
  });

  it('round-trips through parseDirectoryParams', () => {
    const params: DirectoryParams = {
      q: 'Ada & co',
      department: 'Física',
      university: 'Uni = 1',
      graduationYear: 1999,
      page: 7,
    };
    expect(parseDirectoryParams(toSearchParams(params), NOW)).toEqual(params);
    expect(parseDirectoryParams(toSearchParams({ page: 1 }), NOW)).toEqual({ page: 1 });
  });
});
