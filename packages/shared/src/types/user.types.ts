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