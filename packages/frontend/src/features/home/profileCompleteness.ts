import type { MyProfile } from '@alumni/shared';

/** A profile field Home's completeness card counts. */
export type CompletenessField =
  | 'headline'
  | 'job_title'
  | 'company'
  | 'department'
  | 'graduation_year'
  | 'expected_graduation_year'
  | 'bio';

/**
 * The fields counted per account kind (REQ-016 A2, ADV-003), in the order the
 * next step is picked. Headline is alumni-only (`PUT /api/me` ignores it for
 * students), so students are never asked for it and can reach 100%. The
 * photo is not counted: nothing in the app can add one yet (no upload
 * endpoint), so it would cap every profile below 100% (decided at the REQ-016
 * implement gate). Add it back here when photo upload ships.
 */
const ALUMNI_FIELDS: readonly CompletenessField[] = [
  'headline',
  'job_title',
  'company',
  'department',
  'graduation_year',
  'bio',
];
const STUDENT_FIELDS: readonly CompletenessField[] = [
  'job_title',
  'company',
  'department',
  'expected_graduation_year',
  'bio',
];

/** The next-step link text for each field, worded after the Account settings labels. */
export const NEXT_STEP_TEXT: Readonly<Record<CompletenessField, string>> = {
  headline: 'Add a headline',
  job_title: 'Add your current role',
  company: 'Add your company',
  department: 'Add your department',
  graduation_year: 'Add your graduation year',
  expected_graduation_year: 'Add your expected graduation year',
  bio: 'Write a few lines about yourself',
};

export interface ProfileCompleteness {
  filled: number;
  total: number;
  /** Rounded to a whole number, 0 to 100. */
  percent: number;
  /** The first missing field in list order; undefined when the profile is complete. */
  nextStep: CompletenessField | undefined;
}

/**
 * True when a value counts as filled: non-blank text, or any number. `/api/me`
 * sends year columns as numbers although `MyProfile` types them as strings (G40).
 */
function isFilled(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim() !== '';
  return false;
}

function valueOf(profile: MyProfile, field: CompletenessField): unknown {
  switch (field) {
    case 'headline':
      return profile.headline;
    case 'job_title':
      return profile.job_title;
    case 'company':
      return profile.current_company;
    case 'department':
      return profile.department;
    case 'graduation_year':
      return profile.graduation_year;
    case 'expected_graduation_year':
      return profile.expected_graduation_year;
    case 'bio':
      return profile.bio;
  }
}

/**
 * How complete the signed-in user's own profile is. Alumni rows are measured
 * against the alumni fields, students rows against the student fields; an
 * account with neither (an admin without a profile) has nothing to fill in
 * and gets null, so Home shows no card.
 */
export function profileCompleteness(profile: MyProfile): ProfileCompleteness | null {
  let fields: readonly CompletenessField[];
  if (profile.has_alumni_profile) fields = ALUMNI_FIELDS;
  else if (profile.has_student_profile) fields = STUDENT_FIELDS;
  else return null;

  const missing = fields.filter((field) => !isFilled(valueOf(profile, field)));
  const filled = fields.length - missing.length;
  return {
    filled,
    total: fields.length,
    percent: Math.round((filled / fields.length) * 100),
    nextStep: missing[0],
  };
}
