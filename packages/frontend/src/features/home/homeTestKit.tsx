/*
 * Test-only helpers for the Home tests (imported by *.test.tsx here, never by
 * app code): the shared fake API from src/test/fakeApi (re-exported, so the
 * tests keep one import), a profile builder and a render helper that seeds
 * `['me']`.
 */
import type { MyProfile } from '@alumni/shared';
import type { ReactNode } from 'react';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { renderWithProviders } from '@/test/fakeApi';

export { fail, mockApi, never, ok, requests, resetApi } from '@/test/fakeApi';
export type { Responder, SeenRequest } from '@/test/fakeApi';

/** An alumni or student account (or one with neither row) for `['me']`. */
export function profile(
  kind: 'alumni' | 'student' | 'none',
  fields: Partial<MyProfile> = {},
): MyProfile {
  return {
    user_id: 1,
    name: 'Amina Rao',
    email: 'amina@example.com',
    role: kind === 'none' ? 'admin' : kind,
    alumni_id: kind === 'alumni' ? 7 : null,
    has_alumni_profile: kind === 'alumni',
    student_id: kind === 'student' ? 9 : null,
    has_student_profile: kind === 'student',
    ...fields,
  };
}

/** Renders `ui` with a query client, a router and (when given) `['me']` already loaded. */
export function renderHome(ui: ReactNode, user?: MyProfile) {
  return renderWithProviders(ui, (queryClient) => {
    if (user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
  });
}
