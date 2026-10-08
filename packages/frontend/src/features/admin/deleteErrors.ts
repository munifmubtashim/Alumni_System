import { isAxiosError } from 'axios';
import { serverMessage } from '@/services/httpErrors';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';

/** What a failed delete in the dialog does. */
export interface DeleteError {
  /** The message shown in the dialog's Alert; the dialog stays open. */
  message?: string;
  /** The alumni was already deleted (404): close, toast, refetch. */
  gone?: boolean;
}

/**
 * Maps a failed DELETE /api/admin/alumni/:id:
 * - 404 means it is gone already (`gone`);
 * - any other 4xx shows the server's message (403 "You can't delete your own
 *   account", 409 "This user still has posts or comments");
 * - network errors and 5xx get the shared "couldn't reach the server" text;
 * - 401 maps to nothing: SessionBridge logs the user out (ADR-03).
 */
export function mapDeleteError(error: unknown): DeleteError {
  if (!isAxiosError(error)) return { message: UNEXPECTED_MESSAGE };
  if (error.response === undefined) return { message: UNREACHABLE_MESSAGE };
  const { status } = error.response;
  if (status === 401) return {};
  if (status === 404) return { gone: true };
  if (status >= 500) return { message: UNREACHABLE_MESSAGE };
  return { message: serverMessage(error.response.data) ?? UNEXPECTED_MESSAGE };
}
