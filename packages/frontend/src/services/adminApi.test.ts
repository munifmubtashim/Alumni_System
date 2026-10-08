import type {
  AdminAlumniCreateInput,
  AdminAlumniUpdateInput,
  AdminStats,
  AlumniListItem,
} from '@alumni/shared';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createAlumniAccount,
  deleteAlumniAccount,
  getAdminStats,
  updateAlumniAccount,
} from './adminApi';
import { httpClient } from './httpClient';

const originalAdapter = httpClient.defaults.adapter;

const stats: AdminStats = { alumni: 1842, students: 312, posts: 96, mentors: 140 };
const row: AlumniListItem = { id: 4, user_id: 9, name: 'Ada Lovelace', graduation_year: 2020 };
const update: AdminAlumniUpdateInput = {
  name: 'Ada Lovelace',
  university: 'NSU',
  graduation_year: '2020',
  department: 'CSE',
  job_title: 'Engineer',
  current_company: 'Analytical Engines',
};
const create: AdminAlumniCreateInput = {
  ...update,
  email: 'ada@example.com',
  password: 'temporary-pass',
};

// The fake adapter answers every request with `data` and keeps the config it got.
function respondWith(data: unknown, status = 200): () => InternalAxiosRequestConfig {
  let captured: InternalAxiosRequestConfig | undefined;
  httpClient.defaults.adapter = (config) => {
    captured = config;
    return Promise.resolve({ data, status, statusText: String(status), headers: {}, config });
  };
  return () => {
    if (!captured) throw new Error('adapter was not called');
    return captured;
  };
}

// A custom adapter must reject non-2xx itself (G26).
function failWith(status: number): void {
  httpClient.defaults.adapter = (config) =>
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

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
}

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
});

describe('admin endpoints', () => {
  it('getAdminStats gets /admin/stats and returns the counts', async () => {
    const sent = respondWith(stats);

    await expect(getAdminStats()).resolves.toEqual(stats);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/admin/stats');
  });

  it('createAlumniAccount posts the input to /admin/alumni and returns the new row', async () => {
    const sent = respondWith(row, 201);

    await expect(createAlumniAccount(create)).resolves.toEqual(row);

    const config = sent();
    expect(config.method).toBe('post');
    expect(config.url).toBe('/admin/alumni');
    expect(bodyOf(config)).toEqual(create);
  });

  it('updateAlumniAccount puts the input to /admin/alumni/:id and returns the row', async () => {
    const sent = respondWith(row);

    await expect(updateAlumniAccount(4, update)).resolves.toEqual(row);

    const config = sent();
    expect(config.method).toBe('put');
    expect(config.url).toBe('/admin/alumni/4');
    expect(bodyOf(config)).toEqual(update);
  });

  it('deleteAlumniAccount deletes /admin/alumni/:id with no body', async () => {
    const sent = respondWith({ message: 'Alumni deleted' });

    await expect(deleteAlumniAccount(4)).resolves.toBeUndefined();

    const config = sent();
    expect(config.method).toBe('delete');
    expect(config.url).toBe('/admin/alumni/4');
    expect(config.data).toBeUndefined();
  });

  it.each([
    ['getAdminStats', () => getAdminStats(), 403],
    ['createAlumniAccount', () => createAlumniAccount(create), 409],
    ['updateAlumniAccount', () => updateAlumniAccount(4, update), 404],
    ['deleteAlumniAccount', () => deleteAlumniAccount(4), 403],
  ] as const)('%s rejects with the axios error on a %i', async (_name, call, status) => {
    failWith(status);

    const error: unknown = await call().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(status);
  });
});
