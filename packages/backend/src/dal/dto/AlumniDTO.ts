import type { BaseDTO } from "./BaseDTO";

// What a new alumni row is built from: user_id plus the stored profile columns (years as numbers).
export type AlumniDTOInit = Pick<AlumniDTO, "user_id"> &
  Partial<
    Pick<
      AlumniDTO,
      | "department"
      | "graduation_year"
      | "current_company"
      | "job_title"
      | "experience"
      | "bio"
      | "linkedin_url"
      | "headline"
      | "location"
      | "degree"
      | "start_year"
      | "mentorship_available"
    >
  >;

export class AlumniDTO implements BaseDTO {
  id!: number;
  user_id: number;
  department?: string;
  graduation_year?: number | null; // INTEGER column, nullable
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  headline?: string;
  location?: string;
  degree?: string;
  start_year?: number | null; // INTEGER column, nullable
  mentorship_available?: boolean; // NOT NULL DEFAULT false in the table
  created_at: Date;
  updated_at: Date;
  // Joined from users on reads; never includes the password.
  name?: string;
  email?: string;
  photo_url?: string;

  // One typed object, so a misspelt or unknown field is a compile error at the call site.
  constructor(fields: AlumniDTOInit) {
    this.user_id = fields.user_id;
    this.department = fields.department;
    this.graduation_year = fields.graduation_year;
    this.current_company = fields.current_company;
    this.job_title = fields.job_title;
    this.experience = fields.experience;
    this.bio = fields.bio;
    this.linkedin_url = fields.linkedin_url;
    this.headline = fields.headline;
    this.location = fields.location;
    this.degree = fields.degree;
    this.start_year = fields.start_year;
    this.mentorship_available = fields.mentorship_available;
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
}
