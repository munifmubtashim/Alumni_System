import { isAxiosError } from 'axios';

export const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect';
export const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';
export const UNREACHABLE_MESSAGE = "Couldn't reach the server, try again";
export const UNEXPECTED_MESSAGE = 'Something went wrong, try again';

/** What a failed submit shows: a form-level message and/or a field message. */
export interface AuthFormError {
  form?: string;
  fields?: { email?: string };
}

type AuthForm = 'login' | 'register';

function serverMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const { message } = data;
  return typeof message === 'string' && message.trim() !== '' ? message : undefined;
}

function mapAuthError(error: unknown, form: AuthForm): AuthFormError {
  if (!isAxiosError(error)) return { form: UNEXPECTED_MESSAGE };
  // No response: offline, DNS, CORS, timeout.
  if (error.response === undefined) return { form: UNREACHABLE_MESSAGE };

  const { status } = error.response;
  const data: unknown = error.response.data;
  if (status >= 500) return { form: UNREACHABLE_MESSAGE };
  // The backend says "Invalid" for both cases; never reveal which field was wrong.
  if (form === 'login' && status === 401) return { form: INVALID_CREDENTIALS_MESSAGE };
  if (form === 'register' && status === 409) return { fields: { email: EMAIL_TAKEN_MESSAGE } };
  return { form: serverMessage(data) ?? UNEXPECTED_MESSAGE };
}

/** Login: 401 → wrong credentials; 400 → the server's message; network/5xx → unreachable. */
export function mapLoginError(error: unknown): AuthFormError {
  return mapAuthError(error, 'login');
}

/** Sign-up: 409 → on the email field; 400 → the server's message; network/5xx → unreachable. */
export function mapRegisterError(error: unknown): AuthFormError {
  return mapAuthError(error, 'register');
}
