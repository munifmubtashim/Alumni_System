import type {
  AdminAlumniCreateInput,
  AdminAlumniUpdateInput,
  AdminStats,
  AlumniListItem,
} from '@alumni/shared';
import { httpClient } from './httpClient';

// Admin-only endpoints (/api/admin/*). Data only: caching, invalidation and
// error messages belong to features/admin. A non-admin gets a 403 here, which
// the caller shows as an error, never as a logout (ADR-03).

// One path segment from an alumni id; encoding keeps a stray "/" or "?" from
// ever changing which endpoint is called.
function segment(id: number): string {
  return encodeURIComponent(String(id));
}

// GET /api/admin/stats: alumni, student, post and mentor counts.
export async function getAdminStats(): Promise<AdminStats> {
  const res = await httpClient.get<AdminStats>('/admin/stats');
  return res.data;
}

// POST /api/admin/alumni answers 201 with the new alumni row (id = alumni id),
// 409 if the email is taken.
export async function createAlumniAccount(input: AdminAlumniCreateInput): Promise<AlumniListItem> {
  const res = await httpClient.post<AlumniListItem>('/admin/alumni', input);
  return res.data;
}

// PUT /api/admin/alumni/:id (alumni id) sets the six editable fields; an
// omitted optional one is cleared. 404 if the alumni is gone.
export async function updateAlumniAccount(
  id: number,
  input: AdminAlumniUpdateInput,
): Promise<AlumniListItem> {
  const res = await httpClient.put<AlumniListItem>(`/admin/alumni/${segment(id)}`, input);
  return res.data;
}

// DELETE /api/admin/alumni/:id (alumni id) removes the account, its posts and
// its comments. 403 for the admin's own account, 404 if the alumni is gone.
export async function deleteAlumniAccount(id: number): Promise<void> {
  await httpClient.delete(`/admin/alumni/${segment(id)}`);
}
