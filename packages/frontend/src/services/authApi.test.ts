import type {
  ChangePasswordInput,
  LoginResponse,
  MyProfile,
  RegisterInput,
  RegisterResponse,
  UpdateMyProfileInput,
} from '@alumni/shared';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { changePassword, getMe, login, register, updateMyProfile } from './authApi';
import { httpClient } from './httpClient';

const originalAdapter = httpClient.defaults.adapter;

// The endpoint functions take no config, so the mock goes on the client's
// default adapter for one test (restored in afterEach).
function respondWith(data: unknown, status = 200): () => InternalAxiosRequestConfig {
  let captured: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    captured = config;
    return Promise.resolve({ data, status, statusText: String(status), headers: {}, config });
  };
  httpClient.defaults.adapter = adapter;
  return () => {
    if (!captured) throw new Error('adapter was not called');
    return captured;
  };
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
}

describe('authApi', () => {
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('login posts the credentials to /auth/login and returns the token', async () => {
    const reply: LoginResponse = { token: 't1' };
    const sent = respondWith(reply);

    await expect(login('a@b.co', 'secret123')).resolves.toEqual(reply);

    const config = sent();
    expect(config.method).toBe('post');
    expect(config.url).toBe('/auth/login');
    expect(bodyOf(config)).toEqual({ email: 'a@b.co', password: 'secret123' });
  });

  it('register posts the input to /auth/register and returns token and user', async () => {
    const input: RegisterInput = {
      role: 'student',
      name: 'Ada',
      email: 'ada@b.co',
      password: 'secret123',
      university: 'NSU',
      department: 'CSE',
      expected_graduation_year: '2028',
    };
    const reply: RegisterResponse = {
      token: 't2',
      user: { id: 7, name: 'Ada', email: 'ada@b.co', role: 'student', university: 'NSU' },
    };
    const sent = respondWith(reply);

    await expect(register(input)).resolves.toEqual(reply);

    const config = sent();
    expect(config.method).toBe('post');
    expect(config.url).toBe('/auth/register');
    expect(bodyOf(config)).toEqual(input);
  });

  it('getMe gets /me and returns the profile', async () => {
    const reply: MyProfile = {
      user_id: 7,
      name: 'Ada',
      email: 'ada@b.co',
      role: 'student',
      alumni_id: null,
      has_alumni_profile: false,
      student_id: 3,
      has_student_profile: true,
    };
    const sent = respondWith(reply);

    await expect(getMe()).resolves.toEqual(reply);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/me');
    expect(config.data).toBeUndefined();
  });
  it('updateMyProfile puts the input to /me and returns the saved profile', async () => {
    const input: UpdateMyProfileInput = {
      name: 'Ada',
      university: 'NSU',
      photo_url: 'https://example.com/a.png',
    };
    const reply: MyProfile = {
      user_id: 7,
      name: 'Ada',
      email: 'ada@b.co',
      role: 'admin',
      university: 'NSU',
      photo_url: 'https://example.com/a.png',
      alumni_id: null,
      has_alumni_profile: false,
      student_id: null,
      has_student_profile: false,
    };
    const sent = respondWith(reply);

    await expect(updateMyProfile(input)).resolves.toEqual(reply);

    const config = sent();
    expect(config.method).toBe('put');
    expect(config.url).toBe('/me');
    expect(bodyOf(config)).toEqual(input);
  });

  it('changePassword puts both passwords to /me/password and resolves on 204', async () => {
    const input: ChangePasswordInput = {
      current_password: 'old-secret',
      new_password: 'new-secret',
    };
    const sent = respondWith('', 204);

    await expect(changePassword(input)).resolves.toBeUndefined();

    const config = sent();
    expect(config.method).toBe('put');
    expect(config.url).toBe('/me/password');
    expect(bodyOf(config)).toEqual(input);
  });
});
