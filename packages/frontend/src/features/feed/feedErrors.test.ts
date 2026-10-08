import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
import { feedErrorMessage } from './feedErrors';

const config = { headers: {} } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

describe('feedErrorMessage', () => {
  it('shows a 403 or 404 message from the API as is', () => {
    expect(
      feedErrorMessage(httpError(403, { message: 'You can only change your own comments' })),
    ).toBe('You can only change your own comments');
    expect(feedErrorMessage(httpError(404, { message: 'Post not found' }))).toBe('Post not found');
  });

  it('falls back when a 4xx has no usable message', () => {
    expect(feedErrorMessage(httpError(400, { message: '  ' }))).toBe(UNEXPECTED_MESSAGE);
    expect(feedErrorMessage(httpError(400, 'oops'))).toBe(UNEXPECTED_MESSAGE);
  });

  it('says the server could not be reached on a 5xx or no response', () => {
    expect(feedErrorMessage(httpError(500, { message: 'Something went wrong' }))).toBe(
      UNREACHABLE_MESSAGE,
    );
    expect(feedErrorMessage(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config))).toBe(
      UNREACHABLE_MESSAGE,
    );
  });

  it('is generic for a non-HTTP error', () => {
    expect(feedErrorMessage(new Error('boom'))).toBe(UNEXPECTED_MESSAGE);
  });
});
