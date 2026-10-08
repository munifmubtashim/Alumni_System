import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { EMAIL_TAKEN_MESSAGE, UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import { mapAdminError } from './adminErrors';
import { formFields } from './validation';

const ADD = formFields('add');
const EDIT = formFields('edit');

function httpError(status: number, data: unknown = {}): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

describe('mapAdminError', () => {
  it('puts a 409 on Email when adding, with the server text or the shared fallback', () => {
    expect(
      mapAdminError(
        httpError(409, { message: 'An account with this email already exists' }),
        'add',
        ADD,
      ),
    ).toEqual({ fields: { email: 'An account with this email already exists' } });
    expect(mapAdminError(httpError(409), 'add', ADD)).toEqual({
      fields: { email: EMAIL_TAKEN_MESSAGE },
    });
  });

  it('reports a 404 on edit as gone', () => {
    expect(mapAdminError(httpError(404, { message: 'Alumni not found' }), 'edit', EDIT)).toEqual({
      gone: true,
    });
  });

  it.each([
    ['Name is required', 'name'],
    ['Email is not valid', 'email'],
    ['Temporary password must be at least 8 characters', 'password'],
    ['University must be at most 150 characters', 'university'],
    ['Graduation year is not valid', 'graduation_year'],
    ['Department contains an invalid character', 'department'],
    ['Job title must be at most 100 characters', 'job_title'],
    ['Company must be at most 100 characters', 'current_company'],
  ])('puts the 400 "%s" on %s', (message, field) => {
    expect(mapAdminError(httpError(400, { message }), 'add', ADD)).toEqual({
      fields: { [field]: message },
    });
  });

  it('puts a field message for a field edit does not show on the form', () => {
    expect(mapAdminError(httpError(400, { message: 'Email is not valid' }), 'edit', EDIT)).toEqual({
      form: 'Email is not valid',
    });
  });

  it('needs the prefix plus a space, so "Names ..." is not the Name field', () => {
    expect(mapAdminError(httpError(400, { message: 'Names clash' }), 'add', ADD)).toEqual({
      form: 'Names clash',
    });
  });

  it('shows any other 4xx message on the form, and a 4xx without one as unexpected', () => {
    expect(mapAdminError(httpError(403, { message: 'Forbidden' }), 'add', ADD)).toEqual({
      form: 'Forbidden',
    });
    expect(mapAdminError(httpError(400), 'add', ADD)).toEqual({ form: UNEXPECTED_MESSAGE });
  });

  it('maps 5xx and network errors to the unreachable text', () => {
    expect(mapAdminError(httpError(500, { message: 'boom' }), 'add', ADD)).toEqual({
      form: UNREACHABLE_MESSAGE,
    });
    const network = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    expect(mapAdminError(network, 'edit', EDIT)).toEqual({ form: UNREACHABLE_MESSAGE });
  });

  it('maps a 401 to nothing (SessionBridge logs out) and a non-HTTP error to unexpected', () => {
    expect(mapAdminError(httpError(401), 'add', ADD)).toEqual({});
    expect(mapAdminError(new Error('bug'), 'add', ADD)).toEqual({ form: UNEXPECTED_MESSAGE });
  });

  it('does not treat a 404 on add or a 409 on edit specially', () => {
    expect(mapAdminError(httpError(404, { message: 'Not found' }), 'add', ADD)).toEqual({
      form: 'Not found',
    });
    expect(mapAdminError(httpError(409, { message: 'Conflict' }), 'edit', EDIT)).toEqual({
      form: 'Conflict',
    });
  });
});
