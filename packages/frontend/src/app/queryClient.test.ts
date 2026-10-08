import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { createQueryClient, is4xxError } from './queryClient';

function httpError(status: number): AxiosError {
  const response = {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  } satisfies AxiosResponse;
  return new AxiosError(
    `HTTP ${String(status)}`,
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    response,
  );
}

function networkError(): AxiosError {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK);
}

// Runs one query that always fails with `error`; returns how many times it was called.
async function attemptsFor(error: Error): Promise<number> {
  const client = createQueryClient();
  let calls = 0;
  await expect(
    client.query({
      queryKey: ['retry-test'],
      queryFn: () => {
        calls += 1;
        return Promise.reject(error);
      },
      retryDelay: 0,
    }),
  ).rejects.toBe(error);
  client.clear();
  return calls;
}

describe('is4xxError', () => {
  it('is true only for axios errors with a 4xx response', () => {
    expect(is4xxError(httpError(400))).toBe(true);
    expect(is4xxError(httpError(499))).toBe(true);
    expect(is4xxError(httpError(500))).toBe(false);
    expect(is4xxError(networkError())).toBe(false);
    expect(is4xxError(new Error('boom'))).toBe(false);
    expect(is4xxError(undefined)).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('sets the default query and mutation options', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();
    expect(queries?.staleTime).toBe(30_000);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(mutations?.retry).toBe(false);
  });

  it.each([404, 401])('does not retry a %i response', async (status) => {
    expect(await attemptsFor(httpError(status))).toBe(1);
  });

  it('retries a 500 response at most twice', async () => {
    expect(await attemptsFor(httpError(500))).toBe(3);
  });

  it('retries a network error at most twice', async () => {
    expect(await attemptsFor(networkError())).toBe(3);
  });
});
