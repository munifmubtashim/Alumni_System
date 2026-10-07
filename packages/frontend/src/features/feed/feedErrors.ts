import { isAxiosError } from 'axios';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';

function serverMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const { message } = data;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

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
