import type { AlumniListResponse } from '@alumni/shared';
import { httpClient } from './httpClient';

// Search params for GET /api/alumni. The page size is the caller's choice; its
// default lives in the directory feature, not here.
export interface AlumniSearchParams {
  q?: string;
  department?: string;
  university?: string;
  graduationYear?: number;
  page: number;
  pageSize: number;
}

type QueryParams = Record<string, string | number>;

// Blank text and missing filters are left out of the query string, so the URL
// only carries what the user actually searched for (the API treats them as
// absent anyway). page and pageSize are always sent.
function toQueryParams(params: AlumniSearchParams): QueryParams {
  const out: QueryParams = {};
  const text = { q: params.q, department: params.department, university: params.university };
  for (const [key, value] of Object.entries(text)) {
    if (value !== undefined && value.trim() !== '') out[key] = value;
  }
  if (params.graduationYear !== undefined) out.graduationYear = params.graduationYear;
  out.page = params.page;
  out.pageSize = params.pageSize;
  return out;
}

export async function searchAlumni(params: AlumniSearchParams): Promise<AlumniListResponse> {
  const res = await httpClient.get<AlumniListResponse>('/alumni', {
    params: toQueryParams(params),
  });
  return res.data;
}
