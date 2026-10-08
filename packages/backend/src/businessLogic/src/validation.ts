import type {
  AdminAlumniFields,
  AlumniEditableFields,
  AlumniSearchFilters,
  AlumniSort,
  SortOrder,
  StudentEditableFields,
  UserBasicsFields,
} from "@alumni/dal";
import { AppError } from "./errors.js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Length limits shared by the profile validators and the directory search.
export const NAME_MAX = 100;
export const DEPARTMENT_MAX = 100;
export const UNIVERSITY_MAX = 150;
export const HEADLINE_MAX = 120;
export const LOCATION_MAX = 100;
export const DEGREE_MAX = 100;
export const JOB_TITLE_MAX = 100;
export const COMPANY_MAX = 100;

export function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new AppError(400, `${field} must be text`);
  // Postgres text can't hold a NUL byte; letting one through turns a bad request into a 500.
  if (value.includes("\u0000")) throw new AppError(400, `${field} contains an invalid character`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new AppError(400, `${field} must be at most ${max} characters`);
  return trimmed || undefined;
}

// true or false only; omitted means false (full-replace save). null, "true", 1 and the like are 400.
export function optionalBoolean(value: unknown, field: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") throw new AppError(400, `${field} must be true or false`);
  return value;
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

// Student details: department + expected year are required; the shared details are optional
// (full replace: omitted ones are cleared). Alumni-only fields in the body are ignored, never validated
// or returned. user_id/id are never accepted.
export function validateStudentFields(body: Record<string, unknown>): StudentEditableFields {
  return {
    ...validateSharedDetails(body),
    department: requiredText(body.department, "Department", DEPARTMENT_MAX),
    expected_graduation_year: requiredExpectedYear(body.expected_graduation_year),
  };
}

type SharedDetails = Pick<AlumniEditableFields, "current_company" | "job_title" | "experience" | "bio" | "linkedin_url">;

// Details alumni and students both have.
function validateSharedDetails(body: Record<string, unknown>): SharedDetails {
  return {
    current_company: optionalText(body.current_company, "Company", COMPANY_MAX),
    job_title: optionalText(body.job_title, "Job title", JOB_TITLE_MAX),
    experience: optionalText(body.experience, "Experience", 5000),
    bio: optionalText(body.bio, "Bio", 2000),
    linkedin_url: optionalWebUrl(body.linkedin_url, "LinkedIn URL"),
  };
}

// Editable alumni fields (full replace: omitted fields are cleared, mentorship_available becomes false).
// user_id/id are never accepted.
export function validateAlumniFields(body: Record<string, unknown>): AlumniEditableFields {
  const department = optionalText(body.department, "Department", DEPARTMENT_MAX);
  const graduation_year = optionalYear(body.graduation_year, "Graduation year");
  const details = validateSharedDetails(body);
  const headline = optionalText(body.headline, "Headline", HEADLINE_MAX);
  const location = optionalText(body.location, "Location", LOCATION_MAX);
  const degree = optionalText(body.degree, "Degree", DEGREE_MAX);
  const start_year = optionalYear(body.start_year, "Start year");
  const mentorship_available = optionalBoolean(body.mentorship_available, "Mentorship availability");
  // Starts with "Graduation year" so the My Profile form shows it on that field, which every width shows.
  if (start_year && graduation_year && Number(start_year) > Number(graduation_year)) {
    throw new AppError(400, "Graduation year can't be before the start year");
  }
  return { department, graduation_year, ...details, headline, location, degree, start_year, mentorship_available };
}

// The six fields an admin sets on an alumni account (POST and PUT /api/admin/alumni). Name is required;
// the rest are optional and an omitted one is cleared on edit. Same limits and messages as the profile
// validators. Email, password, role, user_id and every other key in the body are ignored here.
export function validateAdminAlumniFields(body: Record<string, unknown>): AdminAlumniFields {
  return {
    name: requiredText(body.name, "Name", NAME_MAX),
    university: optionalText(body.university, "University", UNIVERSITY_MAX),
    graduation_year: optionalYear(body.graduation_year, "Graduation year"),
    department: optionalText(body.department, "Department", DEPARTMENT_MAX),
    job_title: optionalText(body.job_title, "Job title", JOB_TITLE_MAX),
    current_company: optionalText(body.current_company, "Company", COMPANY_MAX),
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

const ALUMNI_SORTS: readonly AlumniSort[] = ["name", "graduationYear"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];

// One of a fixed list of words (exact, case-sensitive); empty or whitespace-only counts as absent.
function oneOf<T extends string>(value: unknown, param: string, allowed: readonly T[], label: string): T | undefined {
  const text = singleQueryValue(value, param)?.trim();
  if (!text) return undefined;
  if (!(allowed as readonly string[]).includes(text)) throw new AppError(400, `Invalid ${label}`);
  return text as T;
}

// Parses req.query for the alumni directory into typed filters + paging, or throws AppError(400). Unknown keys are ignored.
// sort (name | graduationYear) and order (asc | desc) are optional; order without sort applies to name.
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
  const sort = oneOf(query.sort, "sort", ALUMNI_SORTS, "sort");
  const order = oneOf(query.order, "order", SORT_ORDERS, "order");
  if (sort || order) {
    filters.sort = sort ?? "name";
    filters.order = order ?? "asc";
  }
  return {
    filters,
    page: pagingNumber(query.page, "page", 1, MAX_PAGE),
    pageSize: pagingNumber(query.pageSize, "pageSize", DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}
