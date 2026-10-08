import type {
  AdminAlumniCreateInput,
  AdminAlumniUpdateInput,
  AlumniListItem,
} from '@alumni/shared';

// Rules and messages mirror the backend, so the client and the server agree:
// businessLogic/src/validation.ts (validateAdminAlumniFields, requiredText,
// optionalText, optionalYear, requiredEmail, validateNewPassword, NAME_MAX,
// UNIVERSITY_MAX, DEPARTMENT_MAX) and AdminManager.createAlumni, which checks
// the temporary password as "Temporary password". These numbers are hand
// copies (@alumni/shared has no runtime code, L-REQ-006-3); the server's own
// 400 message still shows on the field if they ever drift (ADR-04).

export const NAME_MAX = 100;
export const EMAIL_MAX = 100;
export const UNIVERSITY_MAX = 150;
export const DEPARTMENT_MAX = 100;
export const JOB_TITLE_MAX = 100;
export const COMPANY_MAX = 100;
/** optionalYear() first runs the text check with a 10-character limit (G38). */
export const YEAR_TEXT_MAX = 10;
export const YEAR_MIN = 1900;
/** Graduation year: up to this year + 10. */
export const GRADUATION_YEAR_SPAN = 10;
export const PASSWORD_MIN_CHARS = 8;
/** bcrypt only uses the first 72 bytes, so the backend caps the UTF-8 length. */
export const PASSWORD_MAX_BYTES = 72;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Add creates an account (Email and Temporary password show); edit changes the six profile fields. */
export type DrawerMode = 'add' | 'edit';

/** The form as typed; every field is a text input. */
export interface AlumniFormValues {
  name: string;
  email: string;
  university: string;
  graduation_year: string;
  department: string;
  job_title: string;
  current_company: string;
  password: string;
}

export type AlumniField = keyof AlumniFormValues;
export type AlumniFormErrors = Partial<Record<AlumniField, string>>;

// Form order (S6): Full name, Email, University, Graduation year, Department,
// Current role, Company, Temporary password. Edit has no Email or password.
const FIELDS: Record<DrawerMode, readonly AlumniField[]> = {
  add: [
    'name',
    'email',
    'university',
    'graduation_year',
    'department',
    'job_title',
    'current_company',
    'password',
  ],
  edit: ['name', 'university', 'graduation_year', 'department', 'job_title', 'current_company'],
};

/** The fields this mode shows, in form order. */
export function formFields(mode: DrawerMode): readonly AlumniField[] {
  return FIELDS[mode];
}

export const EMPTY_VALUES: AlumniFormValues = {
  name: '',
  email: '',
  university: '',
  graduation_year: '',
  department: '',
  job_title: '',
  current_company: '',
  password: '',
};

// The API sends graduation_year as a number (an INTEGER column, G40) and may
// send null for an empty column.
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/** Edit starts from the row; Email and password stay empty (never shown or sent). */
export function valuesFromRow(row: AlumniListItem): AlumniFormValues {
  return {
    ...EMPTY_VALUES,
    name: text(row.name),
    university: text(row.university),
    graduation_year: text(row.graduation_year),
    department: text(row.department),
    job_title: text(row.job_title),
    current_company: text(row.current_company),
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
  return (
    optionalTextError(value, field, max) ?? (value.trim() ? undefined : `${field} is required`)
  );
}

// Mirrors requiredEmail(): the text checks, then the pattern on the trimmed value.
function emailError(value: string): string | undefined {
  const textError = requiredTextError(value, 'Email', EMAIL_MAX);
  if (textError) return textError;
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Email is not valid';
}

// Mirrors optionalYear(): the 10-character text check first, then 4 digits,
// 1900 to this year + 10.
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

// Mirrors validateNewPassword(value, "Temporary password"): checked as typed
// (never trimmed); the minimum counts characters, the maximum UTF-8 bytes.
function passwordError(value: string): string | undefined {
  if (value.length < PASSWORD_MIN_CHARS) {
    return `Temporary password must be at least ${String(PASSWORD_MIN_CHARS)} characters`;
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
    return 'Temporary password is too long';
  }
  return undefined;
}

function fieldError(field: AlumniField, values: AlumniFormValues, now: Date): string | undefined {
  const value = values[field];
  switch (field) {
    case 'name':
      return requiredTextError(value, 'Name', NAME_MAX);
    case 'email':
      return emailError(value);
    case 'university':
      return optionalTextError(value, 'University', UNIVERSITY_MAX);
    case 'graduation_year':
      return optionalYearError(value, 'Graduation year', now);
    case 'department':
      return optionalTextError(value, 'Department', DEPARTMENT_MAX);
    case 'job_title':
      return optionalTextError(value, 'Job title', JOB_TITLE_MAX);
    case 'current_company':
      return optionalTextError(value, 'Company', COMPANY_MAX);
    case 'password':
      return passwordError(value);
  }
}

/**
 * Checks for the fields this mode shows, in form order (hidden ones are never
 * checked). `now` sets the allowed graduation years (injectable for tests).
 */
export function validateAlumniForm(
  values: AlumniFormValues,
  mode: DrawerMode,
  now: Date = new Date(),
): AlumniFormErrors {
  const errors: AlumniFormErrors = {};
  for (const field of FIELDS[mode]) {
    const message = fieldError(field, values, now);
    if (message !== undefined) errors[field] = message;
  }
  return errors;
}

/**
 * Unsaved input: a shown field differs from where it started. Text compares
 * trimmed; the password counts as typed (spaces are part of a password).
 */
export function isFormDirty(
  values: AlumniFormValues,
  initial: AlumniFormValues,
  mode: DrawerMode,
): boolean {
  return FIELDS[mode].some((field) =>
    field === 'password'
      ? values.password !== initial.password
      : values[field].trim() !== initial[field].trim(),
  );
}

/**
 * The PUT /api/admin/alumni/:id body: exactly the six editable fields, trimmed.
 * The endpoint clears an omitted optional field, so every field is sent; an
 * empty one goes as '' and is cleared (G38: never a partial body).
 */
export function toUpdateInput(values: AlumniFormValues): AdminAlumniUpdateInput {
  return {
    name: values.name.trim(),
    university: values.university.trim(),
    graduation_year: values.graduation_year.trim(),
    department: values.department.trim(),
    job_title: values.job_title.trim(),
    current_company: values.current_company.trim(),
  };
}

/** The POST /api/admin/alumni body: the six fields, the trimmed email and the password as typed. */
export function toCreateInput(values: AlumniFormValues): AdminAlumniCreateInput {
  return { ...toUpdateInput(values), email: values.email.trim(), password: values.password };
}
