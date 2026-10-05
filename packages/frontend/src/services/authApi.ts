import type { LoginResponse, MyProfile, RegisterInput, RegisterResponse } from '@alumni/shared';
import { httpClient } from './httpClient';

// Endpoint functions only: storing the token, caching and navigation belong to
// the callers (features/auth).

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await httpClient.post<LoginResponse>('/auth/login', { email, password });
  return res.data;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const res = await httpClient.post<RegisterResponse>('/auth/register', input);
  return res.data;
}

export async function getMe(): Promise<MyProfile> {
  const res = await httpClient.get<MyProfile>('/me');
  return res.data;
}
