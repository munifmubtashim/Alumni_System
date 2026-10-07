import type {
  ChangePasswordInput,
  LoginResponse,
  MyProfile,
  RegisterInput,
  RegisterResponse,
  UpdateMyProfileInput,
} from '@alumni/shared';
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

// PUT /api/me is a full replace: omitted optional fields are cleared.
export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfile> {
  const res = await httpClient.put<MyProfile>('/me', input);
  return res.data;
}

// PUT /api/me/password answers 204 with no body.
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await httpClient.put('/me/password', input);
}
