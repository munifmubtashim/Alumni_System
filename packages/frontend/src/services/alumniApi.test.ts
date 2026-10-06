import type { Alumni, AlumniListResponse, Post } from '@alumni/shared';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { getAlumniProfile, getPostsByUser, searchAlumni } from './alumniApi';
import { httpClient } from './httpClient';

const originalAdapter = httpClient.defaults.adapter;

const reply: AlumniListResponse = {
  items: [{ id: 1, user_id: 7, name: 'Ada Lovelace', department: 'CSE', graduation_year: 2020 }],
  total: 41,
};

// searchAlumni takes no config, so the mock goes on the client's default
// adapter for one test (restored in afterEach).
function respondWith(data: unknown): () => InternalAxiosRequestConfig {
  let captured: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    captured = config;
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
  httpClient.defaults.adapter = adapter;
  return () => {
    if (!captured) throw new Error('adapter was not called');
    return captured;
  };
}

// A custom adapter must reject non-2xx itself (axios's status check lives inside
// its built-in adapters), the way httpClient.test.ts does.
function failWith(status: number, data: unknown): void {
  httpClient.defaults.adapter = (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
        data,
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );
}

// The query string axios actually sends, so the test checks the wire format.
function queryOf(config: InternalAxiosRequestConfig): URLSearchParams {
  const uri = httpClient.getUri(config);
  return new URL(uri, 'http://localhost').searchParams;
}

describe('searchAlumni', () => {
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('gets /alumni with every param in the query string and returns { items, total }', async () => {
    const sent = respondWith(reply);

    await expect(
      searchAlumni({
        q: 'ada',
        department: 'CSE',
        university: 'NSU',
        graduationYear: 2020,
        page: 2,
        pageSize: 20,
      }),
    ).resolves.toEqual(reply);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/alumni');
    expect(Object.fromEntries(queryOf(config))).toEqual({
      q: 'ada',
      department: 'CSE',
      university: 'NSU',
      graduationYear: '2020',
      page: '2',
      pageSize: '20',
    });
  });

  it('leaves out empty and blank text and undefined filters', async () => {
    const sent = respondWith(reply);

    await searchAlumni({ q: '', department: '   ', university: undefined, page: 1, pageSize: 20 });

    const query = queryOf(sent());
    expect([...query.keys()].sort()).toEqual(['page', 'pageSize']);
  });

  it('always sends page and pageSize, even with no filters', async () => {
    const sent = respondWith(reply);

    await searchAlumni({ page: 1, pageSize: 50 });

    expect(Object.fromEntries(queryOf(sent()))).toEqual({ page: '1', pageSize: '50' });
  });

  it('encodes text with spaces and symbols', async () => {
    const sent = respondWith(reply);

    await searchAlumni({ q: 'R&D lead', page: 1, pageSize: 20 });

    expect(queryOf(sent()).get('q')).toBe('R&D lead');
  });

  it('rejects with the axios error on a non-2xx answer', async () => {
    failWith(400, { message: 'graduationYear must be a 4-digit year' });

    const error: unknown = await searchAlumni({ page: 1, pageSize: 20 }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(400);
  });
});

describe('getAlumniProfile', () => {
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  const profile: Alumni = { id: 3, user_id: 7, name: 'Ada Lovelace', email: 'ada@example.com' };

  it('gets /alumni/:id and returns the profile', async () => {
    const sent = respondWith(profile);

    await expect(getAlumniProfile('3')).resolves.toEqual(profile);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/alumni/3');
  });

  it('encodes an id with odd characters so it stays one path segment', async () => {
    const sent = respondWith(profile);

    await getAlumniProfile('1/../users?x=1#y z');

    expect(sent().url).toBe('/alumni/1%2F..%2Fusers%3Fx%3D1%23y%20z');
  });

  it('rejects with the axios error on a 404', async () => {
    failWith(404, { message: 'Alumni not found' });

    const error: unknown = await getAlumniProfile('999').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(404);
  });
});

describe('getPostsByUser', () => {
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('gets /posts/user/:userId and returns the list', async () => {
    const posts: Post[] = [{ id: 11, user_id: 7, caption: 'Hello' }];
    const sent = respondWith(posts);

    await expect(getPostsByUser(7)).resolves.toEqual(posts);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/posts/user/7');
  });

  it('rejects with the axios error on a non-2xx answer', async () => {
    failWith(500, { message: 'Something went wrong' });

    const error: unknown = await getPostsByUser(7).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(500);
  });
});
