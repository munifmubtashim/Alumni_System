import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  formFields,
  isFormDirty,
  toCreateInput,
  toUpdateInput,
  validateAlumniForm,
  valuesFromRow,
  type AlumniFormValues,
} from './validation';

const NOW = new Date('2026-10-08T12:00:00Z');

const VALID: AlumniFormValues = {
  name: 'Hana Kobayashi',
  email: 'hana@example.com',
  university: 'Keio University',
  graduation_year: '2021',
  department: 'International Business',
  job_title: 'Analyst',
  current_company: 'Keio Capital',
  password: 'temporary1',
};

describe('formFields', () => {
  it('lists S6 order; edit has no email or password', () => {
    expect(formFields('add')).toEqual([
      'name',
      'email',
      'university',
      'graduation_year',
      'department',
      'job_title',
      'current_company',
      'password',
    ]);
    expect(formFields('edit')).not.toContain('email');
    expect(formFields('edit')).not.toContain('password');
  });
});

describe('validateAlumniForm', () => {
  it('passes a valid add form', () => {
    expect(validateAlumniForm(VALID, 'add', NOW)).toEqual({});
  });

  it('requires name, email and the password on add, with the backend messages', () => {
    expect(validateAlumniForm(EMPTY_VALUES, 'add', NOW)).toEqual({
      name: 'Name is required',
      email: 'Email is required',
      password: 'Temporary password must be at least 8 characters',
    });
  });

  it('requires only the name on edit', () => {
    expect(validateAlumniForm(EMPTY_VALUES, 'edit', NOW)).toEqual({ name: 'Name is required' });
  });

  it('treats whitespace-only text as empty', () => {
    expect(validateAlumniForm({ ...VALID, name: '   ' }, 'add', NOW).name).toBe('Name is required');
  });

  it('checks the email pattern on the trimmed value', () => {
    expect(validateAlumniForm({ ...VALID, email: 'no-at-sign' }, 'add', NOW).email).toBe(
      'Email is not valid',
    );
    expect(validateAlumniForm({ ...VALID, email: '  a@b.co  ' }, 'add', NOW).email).toBeUndefined();
  });

  it('applies the backend length limits', () => {
    const errors = validateAlumniForm(
      {
        ...VALID,
        name: 'n'.repeat(101),
        email: `${'e'.repeat(95)}@x.com`,
        university: 'u'.repeat(151),
        department: 'd'.repeat(101),
        job_title: 'j'.repeat(101),
        current_company: 'c'.repeat(101),
      },
      'add',
      NOW,
    );
    expect(errors).toEqual({
      name: 'Name must be at most 100 characters',
      email: 'Email must be at most 100 characters',
      university: 'University must be at most 150 characters',
      department: 'Department must be at most 100 characters',
      job_title: 'Job title must be at most 100 characters',
      current_company: 'Company must be at most 100 characters',
    });
  });

  it('accepts the limits exactly', () => {
    const errors = validateAlumniForm(
      { ...VALID, name: 'n'.repeat(100), university: 'u'.repeat(150) },
      'add',
      NOW,
    );
    expect(errors).toEqual({});
  });

  it('rejects a NUL character like the backend', () => {
    expect(validateAlumniForm({ ...VALID, department: 'a\u0000b' }, 'add', NOW).department).toBe(
      'Department contains an invalid character',
    );
  });

  it('checks the graduation year: 4 digits, 1900 to this year + 10, text limit first', () => {
    const year = (graduation_year: string) =>
      validateAlumniForm({ ...VALID, graduation_year }, 'edit', NOW).graduation_year;
    expect(year('')).toBeUndefined();
    expect(year('1900')).toBeUndefined();
    expect(year('2036')).toBeUndefined();
    expect(year('2037')).toBe('Graduation year is not valid');
    expect(year('1899')).toBe('Graduation year is not valid');
    expect(year('21')).toBe('Graduation year is not valid');
    expect(year('20211')).toBe('Graduation year is not valid');
    expect(year('12345678901')).toBe('Graduation year must be at most 10 characters');
  });

  it('checks the password as typed: 8 characters minimum, 72 UTF-8 bytes maximum', () => {
    const password = (value: string) =>
      validateAlumniForm({ ...VALID, password: value }, 'add', NOW).password;
    expect(password('1234567')).toBe('Temporary password must be at least 8 characters');
    expect(password('12345678')).toBeUndefined();
    expect(password('a'.repeat(72))).toBeUndefined();
    expect(password('é'.repeat(37))).toBe('Temporary password is too long');
  });
});

describe('valuesFromRow', () => {
  it('prefills from the row, a numeric year as text and null as empty', () => {
    const values = valuesFromRow({
      id: 4,
      user_id: 9,
      name: 'Kenji Ito',
      graduation_year: 2017,
      department: 'Economics',
      university: undefined,
      job_title: 'Engineer',
      current_company: 'Acme',
    });
    expect(values).toEqual({
      ...EMPTY_VALUES,
      name: 'Kenji Ito',
      graduation_year: '2017',
      department: 'Economics',
      job_title: 'Engineer',
      current_company: 'Acme',
    });
    expect(valuesFromRow({ id: 1, user_id: 2, graduation_year: null }).graduation_year).toBe('');
  });
});

describe('isFormDirty', () => {
  it('is clean at the start and when only spaces were added to text', () => {
    expect(isFormDirty(EMPTY_VALUES, EMPTY_VALUES, 'add')).toBe(false);
    expect(isFormDirty({ ...EMPTY_VALUES, name: '  ' }, EMPTY_VALUES, 'add')).toBe(false);
  });

  it('is dirty when a shown field changed, or any password was typed', () => {
    expect(isFormDirty({ ...EMPTY_VALUES, name: 'A' }, EMPTY_VALUES, 'add')).toBe(true);
    expect(isFormDirty({ ...EMPTY_VALUES, password: ' ' }, EMPTY_VALUES, 'add')).toBe(true);
  });

  it('ignores fields edit does not show', () => {
    expect(isFormDirty({ ...EMPTY_VALUES, email: 'x' }, EMPTY_VALUES, 'edit')).toBe(false);
  });
});

describe('request bodies', () => {
  it('edit sends exactly the six editable fields, trimmed, empty ones as ""', () => {
    expect(toUpdateInput({ ...VALID, name: ' Hana ', department: '  ' })).toEqual({
      name: 'Hana',
      university: 'Keio University',
      graduation_year: '2021',
      department: '',
      job_title: 'Analyst',
      current_company: 'Keio Capital',
    });
  });

  it('add also sends the trimmed email and the password as typed', () => {
    expect(
      toCreateInput({ ...VALID, email: ' hana@example.com ', password: ' pass word ' }),
    ).toEqual({
      ...toUpdateInput(VALID),
      email: 'hana@example.com',
      password: ' pass word ',
    });
  });
});
