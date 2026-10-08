// Shapes for the alumni directory search (GET /api/alumni).
import type { AlumniDTO } from "./AlumniDTO";

// Sort keys and directions GET /api/alumni accepts. Keep in sync with AlumniSort / SortOrder in @alumni/shared.
export type AlumniSort = "name" | "graduationYear";
export type SortOrder = "asc" | "desc";

// Validated filters for the directory search. Every field is optional; absent means "no filter".
// sort/order only change the ORDER BY, never the WHERE or the total; absent sort keeps the default order (name, id).
export interface AlumniSearchFilters {
  q?: string;
  department?: string;
  university?: string;
  graduationYear?: number;
  sort?: AlumniSort;
  order?: SortOrder;
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
