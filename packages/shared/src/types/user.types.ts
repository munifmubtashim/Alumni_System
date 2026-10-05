export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "student" | "alumni" | "admin";
  photo_url?: string;
  university?: string;
  login_at?: Date;
  logout_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// User as returned by the API — never includes the password hash.
export type PublicUser = Omit<User, "password">;

// Roles anyone can sign up as. Admin accounts are never created through sign-up.
export type SignupRole = "alumni" | "student";

// POST /api/auth/register. Students must give department + expected_graduation_year
// (this year … this year + 8); the other optional fields are alumni-only.
export interface RegisterInput {
  role: SignupRole;
  name: string;
  email: string;
  password: string;
  university: string;
  department?: string;
  expected_graduation_year?: string;
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  linkedin_url?: string;
}

// Kept for compatibility. POST /api/auth/login returns only a token: use
// LoginResponse for login and RegisterResponse for register.
export interface AuthResponse {
  token: string;
  user: PublicUser;
}

// POST /api/auth/login.
export interface LoginResponse {
  token: string;
}

// POST /api/auth/register.
export interface RegisterResponse {
  token: string;
  user: PublicUser;
}
