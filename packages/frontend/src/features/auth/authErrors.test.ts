import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  EMAIL_TAKEN_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  UNEXPECTED_MESSAGE,
  UNREACHABLE_MESSAGE,
  mapLoginError,
  mapRegisterError,
} from './authErrors';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown = {}): AxiosError {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

const networkError = new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {});

describe('mapLoginError', () => {
  it('maps 401 to the one wrong-credentials message, whatever the server said', () => {
    expect(mapLoginError(httpError(401, { message: 'Invalid' }))).toEqual({
      form: INVALID_CREDENTIALS_MESSAGE,
    });
    expect(INVALID_CREDENTIALS_MESSAGE).toBe('Email or password is incorrect');
  });

  it("shows a 400's server message on the form", () => {
    expect(mapLoginError(httpError(400, { message: 'Email is required' }))).toEqual({
      form: 'Email is required',
    });
  });

  it('maps network errors and 5xx to the unreachable message', () => {
    expect(UNREACHABLE_MESSAGE).toBe("Couldn't reach the server, try again");
    expect(mapLoginError(networkError)).toEqual({ form: UNREACHABLE_MESSAGE });
    expect(mapLoginError(httpError(500, { message: 'boom' }))).toEqual({
      form: UNREACHABLE_MESSAGE,
    });
    expect(mapLoginError(httpError(503))).toEqual({ form: UNREACHABLE_MESSAGE });
  });

  it('treats 409 on login as any other client error', () => {
    expect(mapLoginError(httpError(409, { message: 'Conflict' }))).toEqual({ form: 'Conflict' });
  });
});

describe('mapRegisterError', () => {
  it('puts 409 on the email field', () => {
    expect(mapRegisterError(httpError(409, { message: 'anything' }))).toEqual({
      fields: { email: EMAIL_TAKEN_MESSAGE },
    });
    expect(EMAIL_TAKEN_MESSAGE).toBe('An account with this email already exists');
  });

  it("shows a 400's server message on the form", () => {
    expect(
      mapRegisterError(httpError(400, { message: 'Role must be "student" or "alumni"' })),
    ).toEqual({ form: 'Role must be "student" or "alumni"' });
  });

  it('maps network errors and 5xx to the unreachable message', () => {
    expect(mapRegisterError(networkError)).toEqual({ form: UNREACHABLE_MESSAGE });
    expect(mapRegisterError(httpError(500, { message: 'Registration failed' }))).toEqual({
      form: UNREACHABLE_MESSAGE,
    });
  });

  it('does not treat a 401 on sign-up as wrong credentials', () => {
    expect(mapRegisterError(httpError(401, { message: 'Invalid' }))).toEqual({ form: 'Invalid' });
  });
});

describe('fallbacks', () => {
  it.each([
    ['no body', undefined],
    ['a string body', 'Bad Request'],
    ['a non-string message', { message: 42 }],
    ['an empty message', { message: '  ' }],
  ])('uses the generic message for a 400 with %s', (_label, data) => {
    expect(mapLoginError(httpError(400, data))).toEqual({ form: UNEXPECTED_MESSAGE });
    expect(mapRegisterError(httpError(400, data))).toEqual({ form: UNEXPECTED_MESSAGE });
  });

  it('uses the generic message for an error that is not from axios', () => {
    expect(mapLoginError(new Error('bug'))).toEqual({ form: UNEXPECTED_MESSAGE });
    expect(mapRegisterError('nope')).toEqual({ form: UNEXPECTED_MESSAGE });
  });
});
