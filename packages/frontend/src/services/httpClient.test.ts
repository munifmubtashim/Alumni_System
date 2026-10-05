import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setToken } from './authToken';
import { httpClient, setUnauthorizedHandler } from './httpClient';

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

// Fails every request with the given HTTP status, the way axios's own adapters do.
function failingAdapter(status: number): AxiosAdapter {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
        data: { message: 'nope' },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );
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

describe('httpClient 401 handling', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
  });

  it("calls the handler with the request's token on a 401 to an authed request", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('abc');

    await expect(httpClient.get('/me', { adapter: failingAdapter(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('abc');
  });

  it('passes the token the request carried, not the one stored later', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('old');
    const adapter: AxiosAdapter = (config) => {
      setToken('new');
      return failingAdapter(401)(config);
    };

    await expect(httpClient.get('/me', { adapter })).rejects.toBeInstanceOf(AxiosError);

    expect(handler).toHaveBeenCalledWith('old');
  });

  it.each(['/auth/login', '/auth/register'])('does not call the handler for %s', async (url) => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('abc');

    await expect(httpClient.post(url, {}, { adapter: failingAdapter(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call the handler when the request carried no token', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(httpClient.get('/me', { adapter: failingAdapter(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call the handler for other error statuses', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('abc');

    await expect(httpClient.get('/me', { adapter: failingAdapter(403) })).rejects.toMatchObject({
      response: { status: 403 },
    });
    await expect(httpClient.get('/me', { adapter: failingAdapter(500) })).rejects.toMatchObject({
      response: { status: 500 },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops calling a handler once it is unregistered, and still rejects', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setUnauthorizedHandler(null);
    setToken('abc');

    await expect(httpClient.get('/me', { adapter: failingAdapter(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
