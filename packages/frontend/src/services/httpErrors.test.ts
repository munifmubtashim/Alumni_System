import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { isNotFoundError } from './httpErrors';

const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };

function httpError(status: number): AxiosError {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data: { message: 'x' },
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

describe('isNotFoundError', () => {
  it('is true for an axios error with a 404 response', () => {
    expect(isNotFoundError(httpError(404))).toBe(true);
  });

  it.each([400, 401, 403, 500])('is false for a %i response', (status) => {
    expect(isNotFoundError(httpError(status))).toBe(false);
  });

  it('is false for a network error with no response', () => {
    const err = new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {});
    expect(isNotFoundError(err)).toBe(false);
  });

  it('is false for non-axios errors and other values', () => {
    const lookalike = Object.assign(new Error('nope'), { response: { status: 404 } });
    expect(isNotFoundError(lookalike)).toBe(false);
    expect(isNotFoundError(new Error('404'))).toBe(false);
    expect(isNotFoundError({ response: { status: 404 } })).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});
