import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  optionalBoolean,
  optionalText,
  parseAlumniSearch,
  validateAlumniFields,
  validateStudentFields,
  validateUserBasics,
} from './validation.js';
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
    expect(parseAlumniSearch({ field: 'password', orderBy: 'u.email', q: 'x' })).toEqual({
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

  describe('NUL characters', () => {
    // Postgres rejects \u0000 in text, which would surface as a 500 instead of a 400.
    it.each(['q', 'department', 'university'])('rejects a NUL character in %s', async (param) => {
      const error = await expectAppError(() => parseAlumniSearch({ [param]: 'a\u0000b' }), 400);
      expect(error.message).toBe(`${param} contains an invalid character`);
    });

    it('rejects a NUL character in graduationYear', async () => {
      await expectAppError(() => parseAlumniSearch({ graduationYear: '2020\u0000' }), 400);
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

  describe('sort and order', () => {
    it('no sort and no order adds neither to the filters (the default order)', () => {
      expect(parseAlumniSearch({ q: 'x' }).filters).toEqual({ q: 'x' });
    });

    it.each([
      [{ sort: 'name' }, { sort: 'name', order: 'asc' }],
      [{ sort: 'name', order: 'desc' }, { sort: 'name', order: 'desc' }],
      [{ sort: 'graduationYear' }, { sort: 'graduationYear', order: 'asc' }],
      [{ sort: 'graduationYear', order: 'asc' }, { sort: 'graduationYear', order: 'asc' }],
      [{ sort: ' graduationYear ', order: ' desc ' }, { sort: 'graduationYear', order: 'desc' }],
      [{ order: 'desc' }, { sort: 'name', order: 'desc' }],
    ])('accepts %j', (query, expected) => {
      expect(parseAlumniSearch(query).filters).toEqual(expected);
    });

    it.each(['', '   '])('treats an empty sort and order (%j) as absent', (blank) => {
      expect(parseAlumniSearch({ sort: blank, order: blank }).filters).toEqual({});
      expect(parseAlumniSearch({ sort: blank, order: 'desc' }).filters).toEqual({ sort: 'name', order: 'desc' });
      expect(parseAlumniSearch({ sort: 'graduationYear', order: blank }).filters).toEqual({
        sort: 'graduationYear',
        order: 'asc',
      });
    });

    it.each(['email', 'Name', 'graduation_year', 'u.name', 'name; DROP TABLE users', 'name\u0000'])(
      'rejects sort %j',
      async (sort) => {
        const error = await expectAppError(() => parseAlumniSearch({ sort }), 400);
        expect(error.message).toBe('Invalid sort');
      },
    );

    it.each(['ASC', 'up', 'descending', '1'])('rejects order %j', async (order) => {
      const error = await expectAppError(() => parseAlumniSearch({ sort: 'name', order }), 400);
      expect(error.message).toBe('Invalid order');
    });
  });

  describe('repeated or nested parameters', () => {
    it.each(['q', 'department', 'university', 'graduationYear', 'sort', 'order', 'page', 'pageSize'])(
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

describe('optionalText', () => {
  it('rejects a NUL character anywhere, even one trimming would not remove', async () => {
    await expectAppError(() => optionalText('\u0000', 'Bio', 10), 400);
    const error = await expectAppError(() => optionalText('a\u0000b', 'Bio', 10), 400);
    expect(error.message).toBe('Bio contains an invalid character');
  });

  it('still trims and returns ordinary text', () => {
    expect(optionalText('  hi  ', 'Bio', 10)).toBe('hi');
  });

  it('protects the profile validators too', async () => {
    await expectAppError(() => validateAlumniFields({ bio: 'x\u0000' }), 400);
    await expectAppError(() => validateUserBasics({ name: 'Ada\u0000' }), 400);
  });
});

describe('optionalBoolean', () => {
  it('returns true and false as they are, and false when omitted', () => {
    expect(optionalBoolean(true, 'X')).toBe(true);
    expect(optionalBoolean(false, 'X')).toBe(false);
    expect(optionalBoolean(undefined, 'X')).toBe(false);
  });

  it.each([null, 'true', 'false', 1, 0, '', {}, []])('rejects %j with a message naming the field', async (value) => {
    const error = await expectAppError(() => optionalBoolean(value, 'Mentorship availability'), 400);
    expect(error.message).toBe('Mentorship availability must be true or false');
  });
});

describe('validateAlumniFields: headline, location, degree, start year, mentorship (REQ-011)', () => {
  const thisYear = new Date().getFullYear();

  it('returns the five fields, text trimmed', () => {
    expect(
      validateAlumniFields({
        headline: '  Product designer  ',
        location: ' Oslo ',
        degree: ' B.Sc. Product Design ',
        start_year: '2013',
        graduation_year: '2017',
        mentorship_available: true,
      }),
    ).toMatchObject({
      headline: 'Product designer',
      location: 'Oslo',
      degree: 'B.Sc. Product Design',
      start_year: '2013',
      graduation_year: '2017',
      mentorship_available: true,
    });
  });

  it('omitted fields are cleared and mentorship_available becomes false', () => {
    const fields = validateAlumniFields({});
    expect(fields).toMatchObject({ headline: undefined, location: undefined, degree: undefined, start_year: undefined });
    expect(fields.mentorship_available).toBe(false);
  });

  it.each(['', '   ', null])('empty or null text (%j) clears the field', (blank) => {
    expect(validateAlumniFields({ headline: blank, location: blank, degree: blank, start_year: blank })).toMatchObject({
      headline: undefined,
      location: undefined,
      degree: undefined,
      start_year: undefined,
    });
  });

  it.each([
    ['headline', 'Headline', 120],
    ['location', 'Location', 100],
    ['degree', 'Degree', 100],
  ])('%s: accepts %i characters, rejects one more, measured after trimming', async (key, label, max) => {
    expect(validateAlumniFields({ [key]: ` ${'a'.repeat(max)} ` })[key as 'headline']).toHaveLength(max);
    const error = await expectAppError(() => validateAlumniFields({ [key]: 'a'.repeat(max + 1) }), 400);
    expect(error.message).toBe(`${label} must be at most ${max} characters`);
  });

  it.each([
    ['headline', 'Headline'],
    ['location', 'Location'],
    ['degree', 'Degree'],
    ['start_year', 'Start year'],
  ])('%s: a NUL character is 400 naming the field', async (key, label) => {
    const error = await expectAppError(() => validateAlumniFields({ [key]: '20\u000013' }), 400);
    expect(error.message).toBe(`${label} contains an invalid character`);
  });

  it.each([
    ['headline', 'Headline'],
    ['location', 'Location'],
    ['degree', 'Degree'],
  ])('%s: non-text is 400 naming the field', async (key, label) => {
    const error = await expectAppError(() => validateAlumniFields({ [key]: 42 }), 400);
    expect(error.message).toBe(`${label} must be text`);
  });

  describe('start_year', () => {
    it.each(['1900', String(thisYear + 10)])('accepts %s', (year) => {
      expect(validateAlumniFields({ start_year: year }).start_year).toBe(year);
    });

    it('accepts a number and returns it as text', () => {
      expect(validateAlumniFields({ start_year: 2013 }).start_year).toBe('2013');
    });

    it.each(['1899', String(thisYear + 11), '13', '20130', '2o13', '-2013', '2013.0'])('rejects %j', async (year) => {
      const error = await expectAppError(() => validateAlumniFields({ start_year: year }), 400);
      expect(error.message).toBe('Start year is not valid');
    });
  });

  describe('start year before graduation year', () => {
    it('start after graduation → 400 on the Graduation year field', async () => {
      const error = await expectAppError(
        () => validateAlumniFields({ start_year: '2018', graduation_year: '2017' }),
        400,
      );
      expect(error.message).toBe("Graduation year can't be before the start year");
    });

    it.each([
      ['same year', { start_year: '2017', graduation_year: '2017' }],
      ['start only', { start_year: '2017' }],
      ['graduation only', { graduation_year: '2017' }],
    ])('%s is fine', (_label, body) => {
      expect(() => validateAlumniFields(body)).not.toThrow();
    });
  });

  it.each([null, 'true', 1])('mentorship_available %j → 400', async (value) => {
    await expectAppError(() => validateAlumniFields({ mentorship_available: value }), 400);
  });
});

describe('validateStudentFields ignores the alumni-only fields', () => {
  const student = { department: 'CSE', expected_graduation_year: String(new Date().getFullYear() + 1) };

  it('junk headline, start year and mentorship do not fail and are not returned', () => {
    const fields = validateStudentFields({
      ...student,
      job_title: 'Intern',
      headline: 'x'.repeat(500),
      location: 42,
      degree: 'a\u0000b',
      start_year: 'soon',
      graduation_year: '20x0',
      mentorship_available: 'yes',
    });
    expect(fields).toEqual({
      department: 'CSE',
      expected_graduation_year: student.expected_graduation_year,
      current_company: undefined,
      job_title: 'Intern',
      experience: undefined,
      bio: undefined,
      linkedin_url: undefined,
    });
    for (const key of ['headline', 'location', 'degree', 'start_year', 'graduation_year', 'mentorship_available']) {
      expect(fields).not.toHaveProperty(key);
    }
  });

  it('still validates the shared details', async () => {
    await expectAppError(() => validateStudentFields({ ...student, bio: 'x'.repeat(2001) }), 400);
  });
});
