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

// GET /api/alumni?q=&department=&university=&graduationYear=&page=&pageSize=
// page defaults to 1 (max 10000), pageSize to 20 (max 100). total counts every match, not just this page.
export interface AlumniListResponse {
  items: AlumniListItem[];
  total: number;
}

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
  created_at?: Date;
  login_at?: Date;
  updated_at?: Date; // latest change to the account or alumni profile
}

// PUT /api/me replaces all of these; omitted optional fields are cleared (an omitted email is kept).
// Everyone can change name, email, photo_url and university. Alumni and students (with a profile row)
// also edit company, job title, LinkedIn, bio and experience. Alumni edit department + graduation_year;
// students must send department + expected_graduation_year.
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
}

// PUT /api/me/password (204 on success). new_password: 8–72 characters, different from the current one.
export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}
