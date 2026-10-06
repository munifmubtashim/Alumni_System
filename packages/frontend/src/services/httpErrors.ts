import axios from 'axios';

// True only for an axios error whose response came back 404. A network error
// (no response), any other status and non-axios errors are all false, so a
// caller can show "not found" without hiding real failures behind it.
export function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}
