import { isAxiosError } from 'axios';
import { EMAIL_TAKEN_MESSAGE, UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import type { AlumniField, AlumniFormErrors, DrawerMode } from './validation';

/** What a failed save in the drawer shows. */
export interface AdminFormError {
  /** A message for the whole form (an Alert at the top of the drawer). */
  form?: string;
  /** Messages for single fields. */
  fields?: AlumniFormErrors;
  /** Edit only: the alumni was deleted meanwhile (404). Close, toast, refetch. */
  gone?: boolean;
}

// Backend message prefixes (businessLogic/src/validation.ts field names and
// AdminManager's "Temporary password") to form fields. An explicit table
// because the labels differ (Name is "Full name", Job title is "Current role"),
// matched as "prefix + space", longest first (G38).
const FIELD_PREFIXES: readonly (readonly [string, AlumniField])[] = [
  ['Temporary password', 'password'],
  ['Graduation year', 'graduation_year'],
  ['University', 'university'],
  ['Department', 'department'],
  ['Job title', 'job_title'],
  ['Company', 'current_company'],
  ['Email', 'email'],
  ['Name', 'name'],
];

function serverMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const { message } = data;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

function fieldFor(message: string): AlumniField | undefined {
  return FIELD_PREFIXES.find(([prefix]) => message.startsWith(`${prefix} `))?.[1];
}

/**
 * Maps a failed POST or PUT /api/admin/alumni:
 * - 409 on add (email taken) goes on Email;
 * - 404 on edit means the alumni is gone (`gone`);
 * - a 4xx whose message names a field shown in this mode goes on that field;
 *   any other 4xx shows the server's message on the form;
 * - network errors and 5xx get the shared "couldn't reach the server" text;
 * - 401 maps to nothing: SessionBridge logs the user out (ADR-03).
 */
export function mapAdminError(
  error: unknown,
  mode: DrawerMode,
  visible: readonly AlumniField[],
): AdminFormError {
  if (!isAxiosError(error)) return { form: UNEXPECTED_MESSAGE };
  if (error.response === undefined) return { form: UNREACHABLE_MESSAGE };

  const { status } = error.response;
  if (status === 401) return {};
  if (status >= 500) return { form: UNREACHABLE_MESSAGE };
  const message = serverMessage(error.response.data);
  if (status === 404 && mode === 'edit') return { gone: true };
  if (status === 409 && mode === 'add') {
    return { fields: { email: message ?? EMAIL_TAKEN_MESSAGE } };
  }

  if (message === undefined) return { form: UNEXPECTED_MESSAGE };
  const field = fieldFor(message);
  if (field !== undefined && visible.includes(field)) return { fields: { [field]: message } };
  return { form: message };
}
