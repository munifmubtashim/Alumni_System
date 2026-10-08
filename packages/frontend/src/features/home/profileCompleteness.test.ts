import type { MyProfile } from '@alumni/shared';
import { describe, expect, it } from 'vitest';
import { NEXT_STEP_TEXT, profileCompleteness } from './profileCompleteness';

const base: MyProfile = {
  user_id: 1,
  name: 'Amina Rao',
  email: 'amina@example.com',
  role: 'alumni',
  alumni_id: 7,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

const fullAlumni: MyProfile = {
  ...base,
  photo_url: 'https://example.com/a.png',
  headline: 'Data engineer',
  job_title: 'Engineer',
  current_company: 'Acme',
  department: 'CS',
  graduation_year: '2017',
  bio: 'Hello',
};

const student: MyProfile = {
  ...base,
  role: 'student',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: 9,
  has_student_profile: true,
};

describe('profileCompleteness', () => {
  it('counts no fields filled as 0% and asks for the headline first', () => {
    expect(profileCompleteness(base)).toEqual({
      filled: 0,
      total: 6,
      percent: 0,
      nextStep: 'headline',
    });
  });

  it('counts a partial alumni profile and names the first missing field', () => {
    const result = profileCompleteness({
      ...base,
      job_title: 'Engineer',
      department: 'CS',
    });
    expect(result).toEqual({ filled: 2, total: 6, percent: 33, nextStep: 'headline' });
  });

  it('reads a complete alumni profile as 100% with no next step', () => {
    expect(profileCompleteness(fullAlumni)).toEqual({
      filled: 6,
      total: 6,
      percent: 100,
      nextStep: undefined,
    });
  });

  it('treats blank text and null as missing', () => {
    const result = profileCompleteness({ ...fullAlumni, headline: '   ', bio: null as never });
    expect(result?.filled).toBe(4);
    expect(result?.nextStep).toBe('headline');
  });

  it('accepts a year sent as a number (G40)', () => {
    const result = profileCompleteness({
      ...fullAlumni,
      graduation_year: 2017 as unknown as string,
    });
    expect(result?.percent).toBe(100);
  });

  it('never asks a student for a headline, and a student can reach 100%', () => {
    const partial = profileCompleteness({ ...student, headline: null });
    expect(partial).toEqual({ filled: 0, total: 5, percent: 0, nextStep: 'job_title' });

    const full = profileCompleteness({
      ...student,
      job_title: 'Intern',
      current_company: 'Acme',
      department: 'CS',
      expected_graduation_year: '2028',
      bio: 'Hi',
    });
    expect(full).toEqual({ filled: 5, total: 5, percent: 100, nextStep: undefined });
  });

  it('does not count the photo: no upload exists, so it must not cap a profile below 100%', () => {
    expect(profileCompleteness({ ...fullAlumni, photo_url: undefined })?.percent).toBe(100);
    expect(profileCompleteness({ ...base, photo_url: 'https://example.com/a.png' })?.percent).toBe(
      0,
    );
  });

  it('asks a student for the expected graduation year, not the graduation year', () => {
    const result = profileCompleteness({
      ...student,
      job_title: 'Intern',
      current_company: 'Acme',
      department: 'CS',
      graduation_year: '2020',
      bio: 'Hi',
    });
    expect(result?.nextStep).toBe('expected_graduation_year');
  });

  it('gives null for an account with neither an alumni nor a student row', () => {
    expect(
      profileCompleteness({ ...base, role: 'admin', alumni_id: null, has_alumni_profile: false }),
    ).toBeNull();
  });

  it('has next-step text for every field', () => {
    for (const text of Object.values(NEXT_STEP_TEXT)) expect(text.trim()).not.toBe('');
  });
});
