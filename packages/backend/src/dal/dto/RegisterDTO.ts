// Shapes for self-registration (POST /api/auth/register) and /api/me.

export interface RegisterUserFields {
  name: string;
  email: string;
  password: string; // bcrypt hash, never plaintext
  university: string;
}

export interface AlumniProfileFields {
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  linkedin_url?: string;
}

export interface StudentProfileFields {
  department?: string;
  expected_graduation_year?: string;
}

// users row without the password column.
export interface PublicUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  photo_url?: string;
  university?: string;
  created_at: Date;
}

// The caller's account (users) plus their alumni or students row if they have one (GET/PUT /api/me).
// Never contains the password.
export interface MyProfileRow {
  user_id: number;
  name: string;
  email: string;
  photo_url?: string;
  role: string;
  university?: string;
  alumni_id: number | null;
  has_alumni_profile: boolean;
  student_id: number | null;
  has_student_profile: boolean;
  // department, company, job title, experience, bio and LinkedIn come from the alumni row,
  // or from the students row for students.
  department?: string;
  expected_graduation_year?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  // Alumni-only (null for students and accounts without an alumni row); mentorship_available is never null.
  headline?: string;
  location?: string;
  degree?: string;
  start_year?: string;
  mentorship_available?: boolean;
  created_at?: Date;
  login_at?: Date;
  updated_at?: Date; // latest change to the users or alumni row
}

// users fields any account may change on itself. Email and password are updated separately
// (both need the current password); role is never editable.
export interface UserBasicsFields {
  name: string;
  photo_url?: string;
  university?: string;
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
  headline?: string;
  location?: string;
  degree?: string;
  start_year?: string; // text like graduation_year; INTEGER column
  // Always set by the validator: a full-replace save that omits it means false.
  mentorship_available: boolean;
}

// students fields an owner may change (the alumni-style details plus the student ones).
// user_id and id are not here on purpose.
export interface StudentEditableFields extends StudentProfileFields {
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
}
