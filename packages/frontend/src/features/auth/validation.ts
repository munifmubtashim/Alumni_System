import type { RegisterInput, SignupRole } from '@alumni/shared';

// Rules and messages mirror the backend (businessLogic/src/validation.ts and
// UserManager.validateRegistration), so the client and the server agree.
// The server's own 400 message is still shown if they ever drift (ADR-04).

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX = 100;
export const EMAIL_MAX = 100;
export const UNIVERSITY_MAX = 150;
export const DEPARTMENT_MAX = 100;
export const PASSWORD_MIN_CHARS = 8;
/** bcrypt only uses the first 72 bytes, so the backend caps the UTF-8 length. */
export const PASSWORD_MAX_BYTES = 72;
/** Students can graduate from this year to this year + 8. */
export const EXPECTED_YEAR_SPAN = 8;

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  role: SignupRole;
  name: string;
  email: string;
  password: string;
  university: string;
  /** Students only. */
  department: string;
  /** Students only; a 4-digit year as typed. */
  expected_graduation_year: string;
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;
export type RegisterErrors = Partial<Record<Exclude<keyof RegisterValues, 'role'>, string>>;

// Mirrors requiredText(): trimmed, required, at most `max` characters.
function requiredTextError(value: string, field: string, max: number): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length > max) return `${field} must be at most ${String(max)} characters`;
  if (!trimmed) return `${field} is required`;
  return undefined;
}

// Mirrors requiredEmail().
function emailError(value: string): string | undefined {
  const textError = requiredTextError(value, 'Email', EMAIL_MAX);
  if (textError) return textError;
  if (!EMAIL_PATTERN.test(value.trim())) return 'Email is not valid';
  return undefined;
}

// Mirrors validateNewPassword(): the minimum counts characters, the maximum UTF-8 bytes.
function newPasswordError(value: string): string | undefined {
  if (value.length < PASSWORD_MIN_CHARS) {
    return `Password must be at least ${String(PASSWORD_MIN_CHARS)} characters`;
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) return 'Password is too long';
  return undefined;
}

// Mirrors requiredExpectedYear().
function expectedYearError(value: string, now: Date): string | undefined {
  const field = 'Expected graduation year';
  const year = value.trim();
  if (!year) return `${field} is required`;
  const thisYear = now.getFullYear();
  const last = thisYear + EXPECTED_YEAR_SPAN;
  const n = Number(year);
  if (!/^\d{4}$/.test(year) || n < thisYear || n > last) {
    return `${field} must be between ${String(thisYear)} and ${String(last)}`;
  }
  return undefined;
}

// Builds an errors object in field order, leaving out fields without an error.
function collect<K extends string>(
  entries: readonly (readonly [K, string | undefined])[],
): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const [field, message] of entries) {
    if (message !== undefined) errors[field] = message;
  }
  return errors;
}

/**
 * Login checks: email present and well formed, password present. No length
 * rules, so an older account's password is never blocked client-side.
 */
export function validateLogin(values: LoginValues): LoginErrors {
  return collect<keyof LoginValues>([
    ['email', emailError(values.email)],
    ['password', values.password === '' ? 'Password is required' : undefined],
  ]);
}

/**
 * Sign-up checks, in form order. Department and expected year are checked only
 * for students; for alumni they are neither validated nor sent.
 * `now` sets the allowed year range (injectable for tests).
 */
export function validateRegister(values: RegisterValues, now: Date = new Date()): RegisterErrors {
  const isStudent = values.role === 'student';
  return collect<keyof RegisterErrors>([
    ['name', requiredTextError(values.name, 'Name', NAME_MAX)],
    ['email', emailError(values.email)],
    ['password', newPasswordError(values.password)],
    ['university', requiredTextError(values.university, 'University', UNIVERSITY_MAX)],
    [
      'department',
      isStudent ? requiredTextError(values.department, 'Department', DEPARTMENT_MAX) : undefined,
    ],
    [
      'expected_graduation_year',
      isStudent ? expectedYearError(values.expected_graduation_year, now) : undefined,
    ],
  ]);
}

/**
 * The request body for valid sign-up values: text trimmed (the password is
 * sent as typed), student-only fields left out for alumni.
 */
export function toRegisterInput(values: RegisterValues): RegisterInput {
  const base = {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    university: values.university.trim(),
  };
  if (values.role === 'alumni') return { role: 'alumni', ...base };
  return {
    role: 'student',
    ...base,
    department: values.department.trim(),
    expected_graduation_year: values.expected_graduation_year.trim(),
  };
}
