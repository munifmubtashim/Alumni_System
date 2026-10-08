// Admin-only endpoints (/api/admin/*). Every route answers 401 without a token and 403 for a non-admin.

// GET /api/admin/stats: alumni rows, student rows, posts, and alumni with mentorship_available = true.
export interface AdminStats {
  alumni: number;
  students: number;
  posts: number;
  mentors: number;
}

// PUT /api/admin/alumni/:id (alumni id). Sets these six fields only; an omitted optional one is cleared.
// The REQ-011 fields, bio, LinkedIn, photo, email, role and password keep their stored values.
// Answers 200 with the alumni row, 400 for a bad value, 404 if the alumni is gone.
export interface AdminAlumniUpdateInput {
  name: string;
  university?: string;
  graduation_year?: string;
  department?: string;
  job_title?: string;
  current_company?: string;
}

// POST /api/admin/alumni: a new alumni account. `password` is the temporary password (sign-up's rules,
// 8–72 characters). Answers 201 with the new alumni row (id = alumni id), 409 if the email is taken.
export interface AdminAlumniCreateInput extends AdminAlumniUpdateInput {
  email: string;
  password: string;
}

// DELETE /api/admin/alumni/:id (alumni id) answers 200 { message } after removing the account, its posts
// and its comments; 403 for the admin's own account, 404 if the alumni is gone.
