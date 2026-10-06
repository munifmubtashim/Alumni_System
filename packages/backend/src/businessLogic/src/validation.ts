import type { AlumniEditableFields, AlumniSearchFilters, StudentEditableFields, UserBasicsFields } from "@alumni/dal";
import { AppError } from "./errors.js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Length limits shared by the profile validators and the directory search.
export const NAME_MAX = 100;
export const DEPARTMENT_MAX = 100;
export const UNIVERSITY_MAX = 150;

export function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new AppError(400, `${field} must be text`);
  // Postgres text can't hold a NUL byte; letting one through turns a bad request into a 500.
  if (value.includes("\u0000")) throw new AppError(400, `${field} contains an invalid character`);
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
    name: requiredText(body.name, "Name", NAME_MAX),
    photo_url: optionalWebUrl(body.photo_url, "Photo URL"),
    university: optionalText(body.university, "University", UNIVERSITY_MAX),
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
    department: requiredText(body.department, "Department", DEPARTMENT_MAX),
    expected_graduation_year: requiredExpectedYear(body.expected_graduation_year),
  };
}

// Editable alumni fields (full replace: omitted fields are cleared). user_id/id are never accepted.
export function validateAlumniFields(body: Record<string, unknown>): AlumniEditableFields {
  return {
    department: optionalText(body.department, "Department", DEPARTMENT_MAX),
    graduation_year: optionalYear(body.graduation_year, "Graduation year"),
    current_company: optionalText(body.current_company, "Company", 100),
    job_title: optionalText(body.job_title, "Job title", 100),
    experience: optionalText(body.experience, "Experience", 5000),
    bio: optionalText(body.bio, "Bio", 2000),
    linkedin_url: optionalWebUrl(body.linkedin_url, "LinkedIn URL"),
  };
}

// Largest Postgres `integer` (int4); a bigger id can't match a row and would make the query error.
export const MAX_DB_ID = 2147483647;

export function requireId(value: unknown, what: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > MAX_DB_ID) throw new AppError(404, `${what} not found`);
  return id;
}

// Alumni directory search (GET /api/alumni). Paging limits: pageSize default 20, max 100; page capped at 10000 to bound OFFSET.
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE = 10000;

export interface AlumniSearch {
  filters: AlumniSearchFilters;
  page: number;
  pageSize: number;
}

// A query-string value must be one string; Express's qs parser turns `?a=1&a=2` into an array and `?a[x]=1` into an object.
function singleQueryValue(value: unknown, param: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new AppError(400, `${param} must be a single value`);
  return value;
}

// Whole number from 1 to max; empty or whitespace-only counts as absent, so the default applies.
function pagingNumber(value: unknown, param: string, fallback: number, max: number): number {
  const text = singleQueryValue(value, param)?.trim();
  if (!text) return fallback;
  const n = Number(text);
  if (!/^\d+$/.test(text) || n < 1 || n > max) {
    throw new AppError(400, `${param} must be a whole number from 1 to ${max}`);
  }
  return n;
}

// Parses req.query for the alumni directory into typed filters + paging, or throws AppError(400). Unknown keys are ignored.
export function parseAlumniSearch(query: Record<string, unknown>): AlumniSearch {
  const filters: AlumniSearchFilters = {};
  // q is matched against name, company and job title, which all share the 100-character limit.
  const q = optionalText(singleQueryValue(query.q, "q"), "q", NAME_MAX);
  if (q) filters.q = q;
  const department = optionalText(singleQueryValue(query.department, "department"), "department", DEPARTMENT_MAX);
  if (department) filters.department = department;
  const university = optionalText(singleQueryValue(query.university, "university"), "university", UNIVERSITY_MAX);
  if (university) filters.university = university;
  const year = optionalYear(singleQueryValue(query.graduationYear, "graduationYear"), "graduationYear");
  if (year) filters.graduationYear = Number(year);
  return {
    filters,
    page: pagingNumber(query.page, "page", 1, MAX_PAGE),
    pageSize: pagingNumber(query.pageSize, "pageSize", DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}
