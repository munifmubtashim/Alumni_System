import axios from 'axios';

// True only for an axios error whose response came back 404. A network error
// (no response), any other status and non-axios errors are all false, so a
// caller can show "not found" without hiding real failures behind it.
export function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

// The API's own error text from a response body ({ message }), or undefined
// when the body has none or it is blank. The text is returned as sent (not
// trimmed); callers pick their own fallback.
export function serverMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const { message } = data;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}
