import type { AlumniEditableFields, StudentEditableFields, UserBasicsFields } from "@alumni/dal";
import { AppError } from "./errors.js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new AppError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new AppError(400, `${field} must be at most ${max} characters`);
  return trimmed || undefined;
}

export function requiredText(value: unknown, field: string, max: number): string {
  const text = optionalText(value, field, max);
  if (!text) throw new AppError(400, `${field} is required`);
  return text;
}

// 4-digit year between 1900 and ten years from now; numbers are accepted too.
export function optionalYear(value: unknown, field: string): string | undefined {
  const year = optionalText(typeof value === "number" ? String(value) : value, field, 10);
  if (!year) return undefined;
  const n = Number(year);
  if (!/^\d{4}$/.test(year) || n < 1900 || n > new Date().getFullYear() + 10) {
    throw new AppError(400, `${field} is not valid`);
  }
  return year;
}

export function optionalWebUrl(value: unknown, field: string): string | undefined {
  const url = optionalText(value, field, 255);
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    throw new AppError(400, `${field} must start with http:// or https://`);
  }
  return url;
}

// 8–72 characters (bcrypt only uses the first 72 bytes).
export function validateNewPassword(value: unknown, field = "Password"): string {
  if (typeof value !== "string" || value.length < 8) {
    throw new AppError(400, `${field} must be at least 8 characters`);
  }
  if (Buffer.byteLength(value, "utf8") > 72) throw new AppError(400, `${field} is too long`);
  return value;
}

export function requiredEmail(value: unknown): string {
  const email = requiredText(value, "Email", 100);
  if (!EMAIL_PATTERN.test(email)) throw new AppError(400, "Email is not valid");
  return email;
}

// Profile fields every account may edit on itself. Email and password have their own checks (UserManager); role is never accepted.
export function validateUserBasics(body: Record<string, unknown>): UserBasicsFields {
  return {
    name: requiredText(body.name, "Name", 100),
    photo_url: optionalWebUrl(body.photo_url, "Photo URL"),
    university: optionalText(body.university, "University", 150),
  };
}

// Expected graduation year for students: this year … this year + 8.
export function requiredExpectedYear(value: unknown): string {
  const field = "Expected graduation year";
  const year = optionalText(typeof value === "number" ? String(value) : value, field, 10);
  if (!year) throw new AppError(400, `${field} is required`);
  const thisYear = new Date().getFullYear();
  const n = Number(year);
  if (!/^\d{4}$/.test(year) || n < thisYear || n > thisYear + 8) {
    throw new AppError(400, `${field} must be between ${thisYear} and ${thisYear + 8}`);
  }
  return year;
}

// Student details: department + expected year are required; the alumni-style details are optional
// (full replace: omitted ones are cleared). user_id/id are never accepted.
export function validateStudentFields(body: Record<string, unknown>): StudentEditableFields {
  const { department: _department, graduation_year: _year, ...details } = validateAlumniFields(body);
  return {
    ...details,
    department: requiredText(body.department, "Department", 100),
    expected_graduation_year: requiredExpectedYear(body.expected_graduation_year),
  };
}

// Editable alumni fields (full replace: omitted fields are cleared). user_id/id are never accepted.
export function validateAlumniFields(body: Record<string, unknown>): AlumniEditableFields {
  return {
    department: optionalText(body.department, "Department", 100),
    graduation_year: optionalYear(body.graduation_year, "Graduation year"),
    current_company: optionalText(body.current_company, "Company", 100),
    job_title: optionalText(body.job_title, "Job title", 100),
    experience: optionalText(body.experience, "Experience", 5000),
    bio: optionalText(body.bio, "Bio", 2000),
    linkedin_url: optionalWebUrl(body.linkedin_url, "LinkedIn URL"),
  };
}

export function requireId(value: unknown, what: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(404, `${what} not found`);
  return id;
}
