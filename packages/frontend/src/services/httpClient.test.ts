import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { setToken } from './authToken';
import { httpClient } from './httpClient';

// Captures the final request config instead of hitting the network.
function captureAdapter(): { adapter: AxiosAdapter; sent: () => InternalAxiosRequestConfig } {
  let captured: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    captured = config;
    return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
  };
  return {
    adapter,
    sent: () => {
      if (!captured) throw new Error('adapter was not called');
      return captured;
    },
  };
}

describe('httpClient', () => {
  it('uses /api as the base URL', () => {
    expect(httpClient.defaults.baseURL).toBe('/api');
  });

  it('attaches the bearer token when one is stored', async () => {
    setToken('abc');
    const { adapter, sent } = captureAdapter();

    await httpClient.get('/me', { adapter });

    expect(sent().headers.Authorization).toBe('Bearer abc');
    expect(sent().headers.Accept).toBe('application/json');
  });

  it('sends no Authorization header without a token', async () => {
    const { adapter, sent } = captureAdapter();

    await httpClient.get('/health', { adapter });

    expect(sent().headers.Authorization).toBeUndefined();
  });

  it('reads the token per request, not once at startup', async () => {
    const first = captureAdapter();
    await httpClient.get('/health', { adapter: first.adapter });
    expect(first.sent().headers.Authorization).toBeUndefined();

    setToken('later');
    const second = captureAdapter();
    await httpClient.get('/health', { adapter: second.adapter });
    expect(second.sent().headers.Authorization).toBe('Bearer later');
  });
});
