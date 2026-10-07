import { isAxiosError } from 'axios';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import type { MeErrors, MeField } from './validation';

/**
 * Shown instead of the server's "Photo URL ..." text: the form has no photo
 * field (the stored link is sent back unchanged), so there is nothing to fix here.
 */
export const PHOTO_URL_MESSAGE =
  "Your saved photo link isn't a valid web address, so the profile can't be saved. Contact support to fix it.";

/** What a failed save shows: a form-level message and/or field messages. */
export interface ProfileFormError {
  form?: string;
  fields?: MeErrors;
}

// Backend message prefixes (businessLogic/src/validation.ts field names and
// UserManager.updateMe / changeMyPassword) to form fields. An explicit table,
// because the UI labels differ (Bio is "About", Job title is "Current role").
// Longer prefixes first, so "Expected graduation year" never matches a shorter one.
// The year order rule's message starts with "Graduation year", so it lands on
// that field, not on Start year.
const FIELD_PREFIXES: readonly (readonly [string, MeField])[] = [
  ['Expected graduation year', 'expected_graduation_year'],
  ['Graduation year', 'graduation_year'],
  ['Current password', 'current_password'],
  ['New password', 'new_password'],
  ['LinkedIn URL', 'linkedin_url'],
  ['University', 'university'],
  ['Department', 'department'],
  ['Experience', 'experience'],
  ['Start year', 'start_year'],
  ['Job title', 'job_title'],
  ['Headline', 'headline'],
  ['Location', 'location'],
  ['Company', 'current_company'],
  ['Degree', 'degree'],
  ['Name', 'name'],
  ['Bio', 'bio'],
];

function serverMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const { message } = data;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

function fieldFor(message: string): MeField | undefined {
  return FIELD_PREFIXES.find(([prefix]) => message.startsWith(`${prefix} `))?.[1];
}

/**
 * Maps a failed PUT /api/me or PUT /api/me/password:
 * - a 4xx whose message names a field goes on that field ("Current password is
 *   incorrect" on current_password); a field not in `visible` goes on the form;
 * - "Photo URL ..." gets plain wording on the form;
 * - any other 4xx shows the server's message on the form;
 * - network errors and 5xx get the shared "couldn't reach the server" text;
 * - 401 maps to nothing: SessionBridge logs the user out (ADR-03).
 */
export function mapProfileError(error: unknown, visible?: readonly MeField[]): ProfileFormError {
  if (!isAxiosError(error)) return { form: UNEXPECTED_MESSAGE };
  if (error.response === undefined) return { form: UNREACHABLE_MESSAGE };

  const { status } = error.response;
  if (status === 401) return {};
  if (status >= 500) return { form: UNREACHABLE_MESSAGE };

  const message = serverMessage(error.response.data);
  if (message === undefined) return { form: UNEXPECTED_MESSAGE };
  if (message.startsWith('Photo URL ')) return { form: PHOTO_URL_MESSAGE };
  const field = fieldFor(message);
  if (field !== undefined && (visible === undefined || visible.includes(field))) {
    return { fields: { [field]: message } };
  }
  return { form: message };
}
