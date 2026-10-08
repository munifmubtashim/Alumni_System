import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import { mapDeleteError } from './deleteErrors';

const config = { headers: {} } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown = {}): AxiosError {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

describe('mapDeleteError', () => {
  it('shows the server message for a refusal', () => {
    expect(
      mapDeleteError(httpError(403, { message: "You can't delete your own account" })),
    ).toEqual({ message: "You can't delete your own account" });
    expect(
      mapDeleteError(httpError(409, { message: 'This user still has posts or comments' })),
    ).toEqual({ message: 'This user still has posts or comments' });
  });

  it('falls back when a 4xx has no message', () => {
    expect(mapDeleteError(httpError(400, { message: '  ' }))).toEqual({
      message: UNEXPECTED_MESSAGE,
    });
  });

  it('treats a 404 as already gone', () => {
    expect(mapDeleteError(httpError(404, { message: 'Alumni not found' }))).toEqual({ gone: true });
  });

  it('maps 5xx and network errors to "couldn\'t reach the server"', () => {
    expect(mapDeleteError(httpError(500, { message: 'boom' }))).toEqual({
      message: UNREACHABLE_MESSAGE,
    });
    expect(mapDeleteError(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config))).toEqual(
      { message: UNREACHABLE_MESSAGE },
    );
  });

  it('leaves a 401 to the session handler', () => {
    expect(mapDeleteError(httpError(401))).toEqual({});
  });

  it('maps anything else to the unexpected message', () => {
    expect(mapDeleteError(new Error('x'))).toEqual({ message: UNEXPECTED_MESSAGE });
  });
});
