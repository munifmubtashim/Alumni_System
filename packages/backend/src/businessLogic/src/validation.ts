import type { AlumniEditableFields, UserBasicsFields } from "@alumni/dal";
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

// Profile fields every account may edit on itself. Email, password and role are never accepted.
export function validateUserBasics(body: Record<string, unknown>): UserBasicsFields {
  return {
    name: requiredText(body.name, "Name", 100),
    photo_url: optionalWebUrl(body.photo_url, "Photo URL"),
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
