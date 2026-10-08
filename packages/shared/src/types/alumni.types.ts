import type { User } from "./user.types";

export interface Alumni {
  id: number;
  user_id: number;
  graduation_year?: number | null; // INTEGER column; null when not set
  department?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  headline?: string | null;
  location?: string | null;
  degree?: string | null;
  start_year?: number | null; // INTEGER column; null when not set
  // The API always sends a boolean (column is NOT NULL DEFAULT false); optional so older fixtures compile.
  mentorship_available?: boolean;
  created_at?: Date;
  updated_at?: Date;
  // Joined from users. `email` is only returned by GET /api/alumni/:id.
  name?: string;
  email?: string;
  photo_url?: string;
  university?: string;
}

// One row of GET /api/alumni: the profile plus the joined public user columns (never email).
export type AlumniListItem = Omit<Alumni, "email">;

// Optional server-side sort on GET /api/alumni. No sort = name, then id (the directory's order).
// order without sort applies to name; graduationYear puts alumni with no year last in both directions.
export type AlumniSort = "name" | "graduationYear";
export type SortOrder = "asc" | "desc";

// GET /api/alumni?q=&department=&university=&graduationYear=&mentorship=&sort=&order=&page=&pageSize=
// mentorship=true returns only alumni with mentorship_available; it takes no other value (REQ-016).
// page defaults to 1 (max 10000), pageSize to 20 (max 100). total counts every match, not just this page.
export interface AlumniListResponse {
  items: AlumniListItem[];
  total: number;
}

// GET /api/alumni/suggestions (any signed-in role; REQ-016): a bare array of up to 5 other alumni,
// never the caller. Order: same department as the caller (their alumni row, else students row) first,
// then same university, then name and id; missing values never count as a match. [] when nobody else.
// The body is AlumniListItem[]; there is no alias, so the name stays free for the UI card.

// GET/PUT /api/me: the caller's account plus their alumni or students row, if they have one.
// Every role gets a profile; alumni fields are empty when has_alumni_profile is false,
// student fields when has_student_profile is false.
export interface MyProfile {
  user_id: number;
  name: string;
  email: string;
  photo_url?: string;
  role: User["role"];
  university?: string;
  alumni_id: number | null;
  has_alumni_profile: boolean;
  student_id: number | null;
  has_student_profile: boolean;
  // department, company, job title, experience, bio and LinkedIn: from the alumni or the student profile.
  department?: string;
  expected_graduation_year?: string; // students only
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  // Alumni only: null for students and accounts without an alumni row.
  headline?: string | null;
  location?: string | null;
  degree?: string | null;
  start_year?: string; // text like graduation_year
  // Always a boolean from the API (false without an alumni row); optional in the type, read missing as false.
  mentorship_available?: boolean;
  created_at?: Date;
  login_at?: Date;
  updated_at?: Date; // latest change to the account or alumni profile
}

// PUT /api/me replaces all of these; omitted optional fields are cleared (an omitted email is kept).
// Everyone can change name, email, photo_url and university. Alumni and students (with a profile row)
// also edit company, job title, LinkedIn, bio and experience. Alumni edit department + graduation_year,
// plus headline, location, degree, start_year (not after graduation_year) and mentorship_available
// (omitted = false); students must send department + expected_graduation_year and never these five.
// Changing the email requires current_password. Role cannot be changed; password has its own endpoint.
export interface UpdateMyProfileInput {
  name: string;
  email?: string;
  current_password?: string;
  photo_url?: string;
  university?: string;
  department?: string;
  expected_graduation_year?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  headline?: string;
  location?: string;
  degree?: string;
  start_year?: string;
  mentorship_available?: boolean;
}

// PUT /api/me/password (204 on success). new_password: 8–72 characters, different from the current one.
export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}
