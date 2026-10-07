import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import { PHOTO_URL_MESSAGE, mapProfileError } from './profileErrors';

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

function badRequest(message: string): AxiosError {
  return httpError(400, { message });
}

const networkError = new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {});

describe('mapProfileError', () => {
  it.each([
    ['Name is required', 'name'],
    ['Name must be at most 100 characters', 'name'],
    ['University must be at most 150 characters', 'university'],
    ['Department is required', 'department'],
    ['Graduation year is not valid', 'graduation_year'],
    ['Expected graduation year must be between 2026 and 2034', 'expected_graduation_year'],
    ['Expected graduation year is required', 'expected_graduation_year'],
    ['Company must be at most 100 characters', 'current_company'],
    ['Job title must be at most 100 characters', 'job_title'],
    ['LinkedIn URL must start with http:// or https://', 'linkedin_url'],
    ['Experience must be at most 5000 characters', 'experience'],
    ['Bio contains an invalid character', 'bio'],
    ['Current password is incorrect', 'current_password'],
    ['Current password is required', 'current_password'],
    ['New password must be at least 8 characters', 'new_password'],
    ['New password is too long', 'new_password'],
    ['New password must be different from the current one', 'new_password'],
  ])('puts "%s" on %s', (message, field) => {
    expect(mapProfileError(badRequest(message))).toEqual({ fields: { [field]: message } });
  });

  it('shows plain wording on the form for a stored photo link the server rejects', () => {
    expect(mapProfileError(badRequest('Photo URL must start with http:// or https://'))).toEqual({
      form: PHOTO_URL_MESSAGE,
    });
  });

  it('puts a field message on the form when that field is not shown', () => {
    expect(mapProfileError(badRequest('Department is required'), ['name', 'university'])).toEqual({
      form: 'Department is required',
    });
    expect(mapProfileError(badRequest('Name is required'), ['name', 'university'])).toEqual({
      fields: { name: 'Name is required' },
    });
  });

  it('shows any other 4xx message on the form', () => {
    expect(mapProfileError(httpError(409, { message: 'Email already in use' }))).toEqual({
      form: 'Email already in use',
    });
    expect(mapProfileError(httpError(404, { message: 'Account not found' }))).toEqual({
      form: 'Account not found',
    });
    expect(mapProfileError(httpError(400, {}))).toEqual({ form: UNEXPECTED_MESSAGE });
  });

  it('maps network errors and 5xx to the unreachable message', () => {
    expect(mapProfileError(networkError)).toEqual({ form: UNREACHABLE_MESSAGE });
    expect(mapProfileError(httpError(500, { message: 'Something went wrong' }))).toEqual({
      form: UNREACHABLE_MESSAGE,
    });
    expect(mapProfileError(httpError(503))).toEqual({ form: UNREACHABLE_MESSAGE });
  });

  it('maps 401 to nothing, leaving it to the session logic', () => {
    expect(mapProfileError(httpError(401, { message: 'Invalid token' }))).toEqual({});
  });

  it('maps a non-HTTP error to the unexpected message', () => {
    expect(mapProfileError(new Error('boom'))).toEqual({ form: UNEXPECTED_MESSAGE });
  });
});
