// Shapes for the alumni directory search (GET /api/alumni).
import type { AlumniDTO } from "./AlumniDTO";

// Validated filters for the directory search. Every field is optional; absent means "no filter".
export interface AlumniSearchFilters {
  q?: string;
  department?: string;
  university?: string;
  graduationYear?: number;
}

export interface AlumniPaging {
  limit: number;
  offset: number;
}

// One list row: the profile plus public user columns, never email.
export type AlumniListRow = Omit<AlumniDTO, "email">;

// One page of results. Sent as-is; the API shape is AlumniListResponse in @alumni/shared, keep them in sync.
export interface AlumniListPage {
  items: AlumniListRow[];
  total: number;
}
