import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '@alumni/shared';

// Rules and messages mirror the backend, so the client and the server agree:
// businessLogic/src/validation.ts (optionalText, requiredText, optionalYear,
// requiredExpectedYear, optionalWebUrl, validateNewPassword, validateAlumniFields,
// validateStudentFields, NAME_MAX, UNIVERSITY_MAX, DEPARTMENT_MAX) and
// UserManager.updateMe / changeMyPassword. These numbers are hand copies
// (@alumni/shared has no runtime code); the server's own 400 message is still
// shown if they ever drift (ADR-04).

export const NAME_MAX = 100;
export const UNIVERSITY_MAX = 150;
export const DEPARTMENT_MAX = 100;
export const COMPANY_MAX = 100;
export const JOB_TITLE_MAX = 100;
export const BIO_MAX = 2000;
export const EXPERIENCE_MAX = 5000;
export const LINKEDIN_URL_MAX = 255;
/** optionalYear() first runs the text check with a 10-character limit. */
export const YEAR_TEXT_MAX = 10;
export const YEAR_MIN = 1900;
/** Graduation year: up to this year + 10. */
export const GRADUATION_YEAR_SPAN = 10;
/** Expected graduation year (students): this year to this year + 8. */
export const EXPECTED_YEAR_SPAN = 8;
export const PASSWORD_MIN_CHARS = 8;
/** bcrypt only uses the first 72 bytes, so the backend caps the UTF-8 length. */
export const PASSWORD_MAX_BYTES = 72;

/** Client-only: the API has no confirmation field. */
export const PASSWORD_MISMATCH_MESSAGE = "Passwords don't match";

/**
 * Which profile the account has. Alumni wins over student, as in
 * UserManager.updateMe; 'none' is an account with neither row (e.g. admin).
 */
export type ProfileKind = 'alumni' | 'student' | 'none';

/** The profile fields as typed (strings). */
export interface ProfileValues {
  name: string;
  bio: string;
  university: string;
  department: string;
  graduation_year: string;
  expected_graduation_year: string;
  job_title: string;
  current_company: string;
  linkedin_url: string;
  experience: string;
}

export interface PasswordValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export type ProfileField = keyof ProfileValues;
export type PasswordField = keyof PasswordValues;
export type MeField = ProfileField | PasswordField;

export type ProfileErrors = Partial<Record<ProfileField, string>>;
export type PasswordErrors = Partial<Record<PasswordField, string>>;
export type MeErrors = Partial<Record<MeField, string>>;

export const EMPTY_PASSWORD_VALUES: PasswordValues = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

export const PASSWORD_FIELDS: readonly PasswordField[] = [
  'current_password',
  'new_password',
  'confirm_password',
];

// Shown fields per kind, in form order: Personal, Education, Career.
const FIELDS: Record<ProfileKind, readonly ProfileField[]> = {
  alumni: [
    'name',
    'bio',
    'university',
    'department',
    'graduation_year',
    'job_title',
    'current_company',
    'linkedin_url',
    'experience',
  ],
  student: [
    'name',
    'bio',
    'university',
    'department',
    'expected_graduation_year',
    'job_title',
    'current_company',
    'linkedin_url',
    'experience',
  ],
  none: ['name', 'university'],
};

export function profileKind(profile: MyProfile): ProfileKind {
  if (profile.has_alumni_profile) return 'alumni';
  if (profile.has_student_profile) return 'student';
  return 'none';
}

/** The profile fields this kind of account sees and sends, in form order. */
export function profileFields(kind: ProfileKind): readonly ProfileField[] {
  return FIELDS[kind];
}

// The API can answer null for an empty column, and a year may arrive as a number.
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/** Form values from the stored profile; null or missing becomes ''. */
export function toValues(profile: MyProfile): ProfileValues {
  return {
    name: text(profile.name),
    bio: text(profile.bio),
    university: text(profile.university),
    department: text(profile.department),
    graduation_year: text(profile.graduation_year),
    expected_graduation_year: text(profile.expected_graduation_year),
    job_title: text(profile.job_title),
    current_company: text(profile.current_company),
    linkedin_url: text(profile.linkedin_url),
    experience: text(profile.experience),
  };
}

// Mirrors optionalText(): NUL rejected, then the trimmed length.
function optionalTextError(value: string, field: string, max: number): string | undefined {
  if (value.includes('\u0000')) return `${field} contains an invalid character`;
  if (value.trim().length > max) return `${field} must be at most ${String(max)} characters`;
  return undefined;
}

// Mirrors requiredText().
function requiredTextError(value: string, field: string, max: number): string | undefined {
  const textError = optionalTextError(value, field, max);
  if (textError) return textError;
  if (!value.trim()) return `${field} is required`;
  return undefined;
}

// Mirrors optionalYear(): 4 digits, 1900 to this year + 10.
function optionalYearError(value: string, field: string, now: Date): string | undefined {
  const textError = optionalTextError(value, field, YEAR_TEXT_MAX);
  if (textError) return textError;
  const year = value.trim();
  if (!year) return undefined;
  const n = Number(year);
  if (!/^\d{4}$/.test(year) || n < YEAR_MIN || n > now.getFullYear() + GRADUATION_YEAR_SPAN) {
    return `${field} is not valid`;
  }
  return undefined;
}

// Mirrors requiredExpectedYear(): this year to this year + 8.
function expectedYearError(value: string, now: Date): string | undefined {
  const field = 'Expected graduation year';
  const textError = requiredTextError(value, field, YEAR_TEXT_MAX);
  if (textError) return textError;
  const year = value.trim();
  const thisYear = now.getFullYear();
  const last = thisYear + EXPECTED_YEAR_SPAN;
  const n = Number(year);
  if (!/^\d{4}$/.test(year) || n < thisYear || n > last) {
    return `${field} must be between ${String(thisYear)} and ${String(last)}`;
  }
  return undefined;
}

// Mirrors optionalWebUrl().
function webUrlError(value: string, field: string): string | undefined {
  const textError = optionalTextError(value, field, LINKEDIN_URL_MAX);
  if (textError) return textError;
  const url = value.trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) return `${field} must start with http:// or https://`;
  return undefined;
}

// Mirrors validateNewPassword(value, "New password"): the minimum counts
// characters, the maximum UTF-8 bytes. Copied from features/auth/validation
// (whose wording says "Password") because the field name differs here.
function newPasswordError(value: string): string | undefined {
  if (value.length < PASSWORD_MIN_CHARS) {
    return `New password must be at least ${String(PASSWORD_MIN_CHARS)} characters`;
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
    return 'New password is too long';
  }
  return undefined;
}

function fieldError(
  field: ProfileField,
  values: ProfileValues,
  kind: ProfileKind,
  now: Date,
): string | undefined {
  const value = values[field];
  switch (field) {
    case 'name':
      return requiredTextError(value, 'Name', NAME_MAX);
    case 'bio':
      return optionalTextError(value, 'Bio', BIO_MAX);
    case 'university':
      return optionalTextError(value, 'University', UNIVERSITY_MAX);
    case 'department':
      return kind === 'student'
        ? requiredTextError(value, 'Department', DEPARTMENT_MAX)
        : optionalTextError(value, 'Department', DEPARTMENT_MAX);
    case 'graduation_year':
      return optionalYearError(value, 'Graduation year', now);
    case 'expected_graduation_year':
      return expectedYearError(value, now);
    case 'job_title':
      return optionalTextError(value, 'Job title', JOB_TITLE_MAX);
    case 'current_company':
      return optionalTextError(value, 'Company', COMPANY_MAX);
    case 'linkedin_url':
      return webUrlError(value, 'LinkedIn URL');
    case 'experience':
      return optionalTextError(value, 'Experience', EXPERIENCE_MAX);
  }
}

/**
 * Profile checks for the fields this kind shows, in form order. Hidden fields
 * are never checked. `now` sets the allowed year ranges (injectable for tests).
 */
export function validateProfile(
  values: ProfileValues,
  kind: ProfileKind,
  now: Date = new Date(),
): ProfileErrors {
  const errors: ProfileErrors = {};
  for (const field of FIELDS[kind]) {
    const message = fieldError(field, values, kind, now);
    if (message !== undefined) errors[field] = message;
  }
  return errors;
}

/** True when any of the three password fields has text. */
export function hasPasswordInput(password: PasswordValues): boolean {
  return PASSWORD_FIELDS.some((field) => password[field] !== '');
}

/**
 * Password checks, only when any of the three fields is filled (all empty means
 * "not changing it"). Passwords are checked as typed, never trimmed.
 */
export function validatePasswordChange(password: PasswordValues): PasswordErrors {
  if (!hasPasswordInput(password)) return {};
  const errors: PasswordErrors = {};
  if (password.current_password === '') errors.current_password = 'Current password is required';
  const newError = newPasswordError(password.new_password);
  if (newError) errors.new_password = newError;
  else if (password.new_password === password.current_password) {
    errors.new_password = 'New password must be different from the current one';
  }
  if (password.confirm_password !== password.new_password) {
    errors.confirm_password = PASSWORD_MISMATCH_MESSAGE;
  }
  return errors;
}

/** True when any field this kind shows differs from the baseline (trimmed). */
export function isProfileChanged(
  values: ProfileValues,
  baseline: ProfileValues,
  kind: ProfileKind,
): boolean {
  return FIELDS[kind].some((field) => values[field].trim() !== baseline[field].trim());
}

/** Unsaved changes: a shown profile field differs, or a password field has text. */
export function isDirty(
  values: ProfileValues,
  baseline: ProfileValues,
  kind: ProfileKind,
  password: PasswordValues,
): boolean {
  return isProfileChanged(values, baseline, kind) || hasPasswordInput(password);
}

export interface SavePlan {
  /** PUT /api/me is needed: a profile field changed. */
  saveProfile: boolean;
  /** PUT /api/me/password is needed: a password field has text. */
  savePassword: boolean;
  /** Errors in form order; when non-empty, nothing is sent. */
  errors: MeErrors;
}

/**
 * What one Save does. When no profile field changed, PUT /api/me is skipped and
 * only the password fields are checked, so a stored value the rules now reject
 * (e.g. a student's past expected year) never blocks a password change (ADV-003).
 */
export function planSave(
  values: ProfileValues,
  baseline: ProfileValues,
  kind: ProfileKind,
  password: PasswordValues,
  now: Date = new Date(),
): SavePlan {
  const saveProfile = isProfileChanged(values, baseline, kind);
  const savePassword = hasPasswordInput(password);
  const errors: MeErrors = {
    ...(saveProfile ? validateProfile(values, kind, now) : {}),
    ...validatePasswordChange(password),
  };
  return { saveProfile, savePassword, errors };
}

/**
 * The PUT /api/me body: every field this kind shows, trimmed (an empty one is
 * sent as '' and cleared, since the endpoint is a full replace), plus the stored
 * photo_url so Save never erases it. Never email, never a hidden field.
 */
export function toUpdateInput(
  values: ProfileValues,
  kind: ProfileKind,
  photoUrl: string | null | undefined,
): UpdateMyProfileInput {
  const input: UpdateMyProfileInput = { name: values.name.trim() };
  for (const field of FIELDS[kind]) input[field] = values[field].trim();
  if (typeof photoUrl === 'string') input.photo_url = photoUrl;
  return input;
}

/** The PUT /api/me/password body, as typed. */
export function toPasswordInput(password: PasswordValues): ChangePasswordInput {
  return { current_password: password.current_password, new_password: password.new_password };
}
