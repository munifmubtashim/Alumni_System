import { isAxiosError } from 'axios';
import { serverMessage } from '@/services/httpErrors';

export const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect';
export const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';
export const UNREACHABLE_MESSAGE = "Couldn't reach the server, try again";
export const UNEXPECTED_MESSAGE = 'Something went wrong, try again';
export const LOGIN_NOT_SAVED_MESSAGE =
  "Couldn't save your sign-in. Check that your browser allows site storage, then try again.";
// Sign-up: the account exists by now, so trying sign-up again would hit "email taken".
export const REGISTER_NOT_SAVED_MESSAGE =
  "Your account was created, but we couldn't save your sign-in. Check that your browser allows site storage, then log in.";

/**
 * The server accepted the login or sign-up, but the browser refused to store
 * the token (storage blocked or full), so there is no session.
 */
export class TokenNotSavedError extends Error {
  constructor() {
    super('The auth token could not be saved to storage');
    this.name = 'TokenNotSavedError';
  }
}

/** What a failed submit shows: a form-level message and/or a field message. */
export interface AuthFormError {
  form?: string;
  fields?: { email?: string };
}

type AuthForm = 'login' | 'register';

function mapAuthError(error: unknown, form: AuthForm): AuthFormError {
  if (error instanceof TokenNotSavedError) {
    return { form: form === 'login' ? LOGIN_NOT_SAVED_MESSAGE : REGISTER_NOT_SAVED_MESSAGE };
  }
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

/**
 * Login: 401 → wrong credentials; 400 → the server's message; network/5xx →
 * unreachable; token not saved → check browser storage.
 */
export function mapLoginError(error: unknown): AuthFormError {
  return mapAuthError(error, 'login');
}

/**
 * Sign-up: 409 → on the email field; 400 → the server's message; network/5xx
 * → unreachable; token not saved → account made, check storage, then log in.
 */
export function mapRegisterError(error: unknown): AuthFormError {
  return mapAuthError(error, 'register');
}
