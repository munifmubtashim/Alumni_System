import { isAxiosError } from 'axios';
import { serverMessage } from '@/services/httpErrors';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';

/**
 * The text a failed feed write shows. A 4xx shows the API's own message as is
 * (a 403 "You can only change your own comments", a 404 "Post not found");
 * no response or a 5xx means the server could not be reached.
 */
export function feedErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return UNEXPECTED_MESSAGE;
  if (error.response === undefined) return UNREACHABLE_MESSAGE;
  if (error.response.status >= 500) return UNREACHABLE_MESSAGE;
  return serverMessage(error.response.data) ?? UNEXPECTED_MESSAGE;
}
