import type { User } from "./user.types";

export interface Alumni {
  id: number;
  user_id: number;
  graduation_year?: string;
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
}

// GET/PUT /api/me: the caller's account plus their alumni row, if they have one.
// Every role gets a profile; alumni fields are empty when has_alumni_profile is false.
export interface MyProfile {
  user_id: number;
  name: string;
  email: string;
  photo_url?: string;
  role: User["role"];
  alumni_id: number | null;
  has_alumni_profile: boolean;
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  updated_at?: Date;
}

// PUT /api/me replaces all of these; omitted optional fields are cleared.
// Accounts without an alumni profile can only change name and photo_url (alumni fields are ignored).
// Email, password and role cannot be changed through this endpoint.
export interface UpdateMyProfileInput {
  name: string;
  photo_url?: string;
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
}
