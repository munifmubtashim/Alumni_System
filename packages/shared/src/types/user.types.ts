export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "student" | "alumni" | "admin";
  photo_url?: string;
  login_at?: Date;
  logout_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// User as returned by the API — never includes the password hash.
export type PublicUser = Omit<User, "password">;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  department?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  linkedin_url?: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}
