import type { MyProfile } from '@alumni/shared';
import { describe, expect, it } from 'vitest';
import {
  BIO_MAX,
  COMPANY_MAX,
  DEPARTMENT_MAX,
  EMPTY_PASSWORD_VALUES,
  EXPECTED_YEAR_SPAN,
  EXPERIENCE_MAX,
  GRADUATION_YEAR_SPAN,
  JOB_TITLE_MAX,
  LINKEDIN_URL_MAX,
  NAME_MAX,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_CHARS,
  PASSWORD_MISMATCH_MESSAGE,
  UNIVERSITY_MAX,
  YEAR_MIN,
  YEAR_TEXT_MAX,
  isDirty,
  planSave,
  profileFields,
  profileKind,
  toPasswordInput,
  toUpdateInput,
  toValues,
  validatePasswordChange,
  validateProfile,
  type PasswordValues,
  type ProfileValues,
} from './validation';

const NOW = new Date(2026, 5, 15);

const base: MyProfile = {
  user_id: 7,
  name: 'Ada',
  email: 'ada@b.co',
  role: 'alumni',
  alumni_id: 3,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

const blank: ProfileValues = {
  name: '',
  bio: '',
  university: '',
  department: '',
  graduation_year: '',
  expected_graduation_year: '',
  job_title: '',
  current_company: '',
  linkedin_url: '',
  experience: '',
};

function values(patch: Partial<ProfileValues> = {}): ProfileValues {
  return { ...blank, name: 'Ada', ...patch };
}

function student(patch: Partial<ProfileValues> = {}): ProfileValues {
  return values({ department: 'CSE', expected_graduation_year: '2028', ...patch });
}

function pw(patch: Partial<PasswordValues> = {}): PasswordValues {
  return { ...EMPTY_PASSWORD_VALUES, ...patch };
}

const goodPassword = pw({
  current_password: 'old-secret',
  new_password: 'new-secret',
  confirm_password: 'new-secret',
});

describe('limits', () => {
  it('match the backend (businessLogic/src/validation.ts)', () => {
    expect(NAME_MAX).toBe(100);
    expect(UNIVERSITY_MAX).toBe(150);
    expect(DEPARTMENT_MAX).toBe(100);
    expect(COMPANY_MAX).toBe(100);
    expect(JOB_TITLE_MAX).toBe(100);
    expect(BIO_MAX).toBe(2000);
    expect(EXPERIENCE_MAX).toBe(5000);
    expect(LINKEDIN_URL_MAX).toBe(255);
    expect(YEAR_TEXT_MAX).toBe(10);
    expect(YEAR_MIN).toBe(1900);
    expect(GRADUATION_YEAR_SPAN).toBe(10);
    expect(EXPECTED_YEAR_SPAN).toBe(8);
    expect(PASSWORD_MIN_CHARS).toBe(8);
    expect(PASSWORD_MAX_BYTES).toBe(72);
  });
});

describe('profileKind', () => {
  it('is alumni when there is an alumni row, even with a students row too', () => {
    expect(profileKind(base)).toBe('alumni');
    expect(profileKind({ ...base, has_student_profile: true, student_id: 4 })).toBe('alumni');
  });

  it('is student with only a students row, none with neither', () => {
    expect(
      profileKind({
        ...base,
        has_alumni_profile: false,
        alumni_id: null,
        has_student_profile: true,
      }),
    ).toBe('student');
    expect(profileKind({ ...base, has_alumni_profile: false, alumni_id: null })).toBe('none');
  });
});

describe('profileFields', () => {
  it('lists the shown fields per kind in form order', () => {
    expect(profileFields('alumni')).toEqual([
      'name',
      'bio',
      'university',
      'department',
      'graduation_year',
      'job_title',
      'current_company',
      'linkedin_url',
      'experience',
    ]);
    expect(profileFields('student')).toContain('expected_graduation_year');
    expect(profileFields('student')).not.toContain('graduation_year');
    expect(profileFields('none')).toEqual(['name', 'university']);
  });
});

describe('toValues', () => {
  it('turns null, missing and numeric values into strings', () => {
    const profile = {
      ...base,
      university: 'NSU',
      bio: null,
      graduation_year: 2019,
    } as unknown as MyProfile;
    expect(toValues(profile)).toEqual({
      ...blank,
      name: 'Ada',
      university: 'NSU',
      graduation_year: '2019',
    });
  });
});

describe('validateProfile', () => {
  it('accepts a valid alumni profile and a valid student profile', () => {
    expect(validateProfile(values({ graduation_year: '2036' }), 'alumni', NOW)).toEqual({});
    expect(validateProfile(student(), 'student', NOW)).toEqual({});
    expect(validateProfile(values(), 'none', NOW)).toEqual({});
  });

  it('requires a name of at most 100 characters', () => {
    expect(validateProfile(values({ name: '   ' }), 'none', NOW)).toEqual({
      name: 'Name is required',
    });
    expect(validateProfile(values({ name: 'a'.repeat(101) }), 'none', NOW)).toEqual({
      name: 'Name must be at most 100 characters',
    });
    expect(validateProfile(values({ name: ` ${'a'.repeat(100)} ` }), 'none', NOW)).toEqual({});
  });

  it('caps university at 150 and does not require it', () => {
    expect(validateProfile(values({ university: 'a'.repeat(151) }), 'none', NOW)).toEqual({
      university: 'University must be at most 150 characters',
    });
  });

  it('makes department optional for alumni and required for students, both at most 100', () => {
    expect(validateProfile(values(), 'alumni', NOW)).toEqual({});
    expect(validateProfile(student({ department: ' ' }), 'student', NOW)).toEqual({
      department: 'Department is required',
    });
    expect(validateProfile(values({ department: 'a'.repeat(101) }), 'alumni', NOW)).toEqual({
      department: 'Department must be at most 100 characters',
    });
  });

  it('checks the graduation year: 4 digits, 1900 to this year + 10', () => {
    const err = { graduation_year: 'Graduation year is not valid' };
    expect(validateProfile(values({ graduation_year: '1900' }), 'alumni', NOW)).toEqual({});
    expect(validateProfile(values({ graduation_year: '2036' }), 'alumni', NOW)).toEqual({});
    expect(validateProfile(values({ graduation_year: '1899' }), 'alumni', NOW)).toEqual(err);
    expect(validateProfile(values({ graduation_year: '2037' }), 'alumni', NOW)).toEqual(err);
    expect(validateProfile(values({ graduation_year: '99' }), 'alumni', NOW)).toEqual(err);
    expect(validateProfile(values({ graduation_year: '20x0' }), 'alumni', NOW)).toEqual(err);
    expect(validateProfile(values({ graduation_year: '12345678901' }), 'alumni', NOW)).toEqual({
      graduation_year: 'Graduation year must be at most 10 characters',
    });
  });

  it('checks the expected year for students: required, this year to this year + 8', () => {
    const range = {
      expected_graduation_year: 'Expected graduation year must be between 2026 and 2034',
    };
    expect(validateProfile(student({ expected_graduation_year: '2026' }), 'student', NOW)).toEqual(
      {},
    );
    expect(validateProfile(student({ expected_graduation_year: '2034' }), 'student', NOW)).toEqual(
      {},
    );
    expect(validateProfile(student({ expected_graduation_year: '2025' }), 'student', NOW)).toEqual(
      range,
    );
    expect(validateProfile(student({ expected_graduation_year: '2035' }), 'student', NOW)).toEqual(
      range,
    );
    expect(validateProfile(student({ expected_graduation_year: '' }), 'student', NOW)).toEqual({
      expected_graduation_year: 'Expected graduation year is required',
    });
  });

  it('caps company and job title at 100, bio at 2000, experience at 5000', () => {
    expect(
      validateProfile(
        values({
          current_company: 'a'.repeat(101),
          job_title: 'a'.repeat(101),
          bio: 'a'.repeat(2001),
          experience: 'a'.repeat(5001),
        }),
        'alumni',
        NOW,
      ),
    ).toEqual({
      bio: 'Bio must be at most 2000 characters',
      job_title: 'Job title must be at most 100 characters',
      current_company: 'Company must be at most 100 characters',
      experience: 'Experience must be at most 5000 characters',
    });
  });

  it('needs LinkedIn to start with http:// or https:// and be at most 255', () => {
    expect(
      validateProfile(values({ linkedin_url: 'https://linkedin.com/in/ada' }), 'alumni', NOW),
    ).toEqual({});
    expect(validateProfile(values({ linkedin_url: 'HTTP://x.co' }), 'alumni', NOW)).toEqual({});
    expect(validateProfile(values({ linkedin_url: 'linkedin.com/in/ada' }), 'alumni', NOW)).toEqual(
      {
        linkedin_url: 'LinkedIn URL must start with http:// or https://',
      },
    );
    expect(
      validateProfile(values({ linkedin_url: `https://${'a'.repeat(248)}` }), 'alumni', NOW),
    ).toEqual({ linkedin_url: 'LinkedIn URL must be at most 255 characters' });
  });

  it('rejects a NUL character in any text field', () => {
    expect(validateProfile(values({ name: 'A\u0000da', bio: 'x\u0000' }), 'alumni', NOW)).toEqual({
      name: 'Name contains an invalid character',
      bio: 'Bio contains an invalid character',
    });
  });

  it('never checks fields the kind does not show', () => {
    const bad = values({
      bio: 'a'.repeat(2001),
      graduation_year: 'nope',
      expected_graduation_year: '',
    });
    expect(validateProfile(bad, 'none', NOW)).toEqual({});
    expect(Object.keys(validateProfile(bad, 'alumni', NOW))).toEqual(['bio', 'graduation_year']);
  });

  it('returns errors in form order', () => {
    const errors = validateProfile(
      student({ name: '', department: '', linkedin_url: 'x', expected_graduation_year: '1' }),
      'student',
      NOW,
    );
    expect(Object.keys(errors)).toEqual([
      'name',
      'department',
      'expected_graduation_year',
      'linkedin_url',
    ]);
  });
});

describe('validatePasswordChange', () => {
  it('checks nothing while all three fields are empty', () => {
    expect(validatePasswordChange(pw())).toEqual({});
  });

  it('accepts a valid change', () => {
    expect(validatePasswordChange(goodPassword)).toEqual({});
  });

  it('checks all three once any is filled', () => {
    expect(validatePasswordChange(pw({ confirm_password: 'x' }))).toEqual({
      current_password: 'Current password is required',
      new_password: 'New password must be at least 8 characters',
      confirm_password: PASSWORD_MISMATCH_MESSAGE,
    });
  });

  it('caps the new password at 72 UTF-8 bytes, not characters', () => {
    const ok = 'a'.repeat(72);
    expect(
      validatePasswordChange({ ...goodPassword, new_password: ok, confirm_password: ok }),
    ).toEqual({});
    const long = 'é'.repeat(37); // 37 characters, 74 bytes
    expect(
      validatePasswordChange({ ...goodPassword, new_password: long, confirm_password: long }),
    ).toEqual({
      new_password: 'New password is too long',
    });
  });

  it('requires the new password to differ from the current one', () => {
    expect(
      validatePasswordChange(
        pw({
          current_password: 'same-pass',
          new_password: 'same-pass',
          confirm_password: 'same-pass',
        }),
      ),
    ).toEqual({ new_password: 'New password must be different from the current one' });
  });

  it('requires the confirmation to match, without trimming', () => {
    expect(validatePasswordChange({ ...goodPassword, confirm_password: 'new-secret ' })).toEqual({
      confirm_password: PASSWORD_MISMATCH_MESSAGE,
    });
  });
});

describe('isDirty', () => {
  const saved = toValues({ ...base, university: 'NSU', bio: null } as unknown as MyProfile);

  it('is false for untouched values, including null from the API vs empty text', () => {
    expect(isDirty(toValues({ ...base, university: 'NSU' }), saved, 'alumni', pw())).toBe(false);
    expect(isDirty(saved, saved, 'alumni', pw())).toBe(false);
  });

  it('ignores whitespace-only differences', () => {
    expect(isDirty({ ...saved, name: ' Ada ' }, saved, 'alumni', pw())).toBe(false);
  });

  it('is true for a changed field', () => {
    expect(isDirty({ ...saved, job_title: 'Engineer' }, saved, 'alumni', pw())).toBe(true);
  });

  it('is true when any password field has text', () => {
    expect(isDirty(saved, saved, 'alumni', pw({ confirm_password: 'x' }))).toBe(true);
    expect(isDirty(saved, saved, 'none', pw({ current_password: ' ' }))).toBe(true);
  });

  it('ignores fields the kind does not show', () => {
    expect(isDirty({ ...saved, bio: 'changed' }, saved, 'none', pw())).toBe(false);
  });
});

describe('planSave', () => {
  const saved = student({ expected_graduation_year: '2020' }); // stored year now out of range

  it('skips the profile call and ignores invalid unchanged profile fields on a password-only change', () => {
    expect(planSave(saved, saved, 'student', goodPassword, NOW)).toEqual({
      saveProfile: false,
      savePassword: true,
      errors: {},
    });
  });

  it('checks only the password fields when only they changed', () => {
    const plan = planSave(saved, saved, 'student', pw({ new_password: 'short' }), NOW);
    expect(plan.saveProfile).toBe(false);
    expect(Object.keys(plan.errors)).toEqual([
      'current_password',
      'new_password',
      'confirm_password',
    ]);
  });

  it('checks the whole profile once a profile field changed', () => {
    const plan = planSave({ ...saved, job_title: 'Intern' }, saved, 'student', pw(), NOW);
    expect(plan).toEqual({
      saveProfile: true,
      savePassword: false,
      errors: {
        expected_graduation_year: 'Expected graduation year must be between 2026 and 2034',
      },
    });
  });

  it('runs both calls when both changed, profile errors first', () => {
    const ok = planSave(
      { ...saved, expected_graduation_year: '2027' },
      saved,
      'student',
      goodPassword,
      NOW,
    );
    expect(ok).toEqual({ saveProfile: true, savePassword: true, errors: {} });
    const bad = planSave(
      { ...saved, name: '' },
      saved,
      'student',
      pw({ current_password: 'x', confirm_password: 'y' }),
      NOW,
    );
    expect(Object.keys(bad.errors)).toEqual([
      'name',
      'expected_graduation_year',
      'new_password',
      'confirm_password',
    ]);
  });

  it('needs neither call when nothing changed', () => {
    expect(planSave(saved, saved, 'student', pw(), NOW)).toEqual({
      saveProfile: false,
      savePassword: false,
      errors: {},
    });
  });
});

describe('toUpdateInput', () => {
  const typed = values({
    name: ' Ada ',
    bio: ' Hi ',
    university: 'NSU ',
    department: 'CSE',
    graduation_year: '2019',
    expected_graduation_year: '2028',
    job_title: '',
    current_company: 'Acme',
    linkedin_url: 'https://x.co',
    experience: 'Lots',
  });

  it('sends every alumni field trimmed, plus the stored photo_url, never email', () => {
    const input = toUpdateInput(typed, 'alumni', 'https://example.com/a.png');
    expect(input).toEqual({
      name: 'Ada',
      bio: 'Hi',
      university: 'NSU',
      department: 'CSE',
      graduation_year: '2019',
      job_title: '',
      current_company: 'Acme',
      linkedin_url: 'https://x.co',
      experience: 'Lots',
      photo_url: 'https://example.com/a.png',
    });
    expect(input).not.toHaveProperty('email');
    expect(input).not.toHaveProperty('expected_graduation_year');
  });

  it('sends the expected year, not the graduation year, for students', () => {
    const input = toUpdateInput(typed, 'student', 'https://example.com/a.png');
    expect(input.expected_graduation_year).toBe('2028');
    expect(input).not.toHaveProperty('graduation_year');
    expect(input.photo_url).toBe('https://example.com/a.png');
  });

  it('sends only name, university and photo_url for an account with no profile row', () => {
    expect(toUpdateInput(typed, 'none', 'https://example.com/a.png')).toEqual({
      name: 'Ada',
      university: 'NSU',
      photo_url: 'https://example.com/a.png',
    });
  });

  it('leaves photo_url out when none is stored', () => {
    expect(toUpdateInput(typed, 'none', null)).toEqual({ name: 'Ada', university: 'NSU' });
    expect(toUpdateInput(typed, 'none', undefined)).not.toHaveProperty('photo_url');
  });
});

describe('toPasswordInput', () => {
  it('sends the current and new password as typed, never the confirmation', () => {
    expect(toPasswordInput({ ...goodPassword, new_password: ' spaced ' })).toEqual({
      current_password: 'old-secret',
      new_password: ' spaced ',
    });
  });
});
