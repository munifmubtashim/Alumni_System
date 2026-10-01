// Shapes for self-registration (POST /api/auth/register) and /api/me.

export interface RegisterUserFields {
  name: string;
  email: string;
  password: string; // bcrypt hash, never plaintext
}

export interface AlumniProfileFields {
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  linkedin_url?: string;
}

// users row without the password column.
export interface PublicUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  photo_url?: string;
  created_at: Date;
}

// The caller's account (users) plus their alumni row if they have one (GET/PUT /api/me).
// Never contains the password.
export interface MyProfileRow {
  user_id: number;
  name: string;
  email: string;
  photo_url?: string;
  role: string;
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

// users fields any account may change on itself. Email, password and role are not here on purpose.
export interface UserBasicsFields {
  name: string;
  photo_url?: string;
}

// alumni fields an owner may change. user_id and id are not here on purpose.
export interface AlumniEditableFields {
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
}
