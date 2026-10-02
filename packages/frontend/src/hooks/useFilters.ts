import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Alumni } from "@alumni/shared";

export type AlumniFilters = {
  q: string;
  universities: string[];
  departments: string[];
  companies: string[];
  yearFrom?: string;
  yearTo?: string;
};

export type FilterOptions = {
  universities: string[];
  departments: string[];
  companies: string[];
  years: string[];
};

// URL query params: ?q=&uni=&dept=&dept=&company=&from=&to=
export function useFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<AlumniFilters>(
    () => ({
      q: params.get("q") ?? "",
      universities: params.getAll("uni"),
      departments: params.getAll("dept"),
      companies: params.getAll("company"),
      yearFrom: params.get("from") ?? undefined,
      yearTo: params.get("to") ?? undefined,
    }),
    [params],
  );

  const setFilters = useCallback(
    (patch: Partial<AlumniFilters>) => {
      const next = { ...filters, ...patch };
      const nextParams = new URLSearchParams();
      if (next.q.trim()) nextParams.set("q", next.q.trim());
      next.universities.forEach((u) => nextParams.append("uni", u));
      next.departments.forEach((d) => nextParams.append("dept", d));
      next.companies.forEach((c) => nextParams.append("company", c));
      if (next.yearFrom) nextParams.set("from", next.yearFrom);
      if (next.yearTo) nextParams.set("to", next.yearTo);
      setParams(nextParams, { replace: true });
    },
    [filters, setParams],
  );

  const clearFilters = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  // Search text is not counted; it is visible in the search bar.
  const activeCount =
    filters.universities.length +
    filters.departments.length +
    filters.companies.length +
    (filters.yearFrom || filters.yearTo ? 1 : 0);

  return { filters, setFilters, clearFilters, activeCount };
}

// Unique values (case-insensitive, first spelling wins), sorted.
function uniqueSorted(values: (string | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function getFilterOptions(alumni: Alumni[]): FilterOptions {
  return {
    universities: uniqueSorted(alumni.map((a) => a.university)),
    departments: uniqueSorted(alumni.map((a) => a.department)),
    companies: uniqueSorted(alumni.map((a) => a.current_company)),
    years: uniqueSorted(alumni.map((a) => a.graduation_year)),
  };
}

const matchesAny = (value: string | undefined, selected: string[]) =>
  selected.length === 0 ||
  (!!value && selected.some((s) => s.toLowerCase() === value.trim().toLowerCase()));

export function filterAlumni(alumni: Alumni[], filters: AlumniFilters): Alumni[] {
  const terms = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
  const from = filters.yearFrom ? Number(filters.yearFrom) : undefined;
  const to = filters.yearTo ? Number(filters.yearTo) : undefined;

  return alumni.filter((a) => {
    if (terms.length) {
      const haystack = [a.name, a.job_title, a.current_company, a.department, a.university]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (!matchesAny(a.university, filters.universities)) return false;
    if (!matchesAny(a.department, filters.departments)) return false;
    if (!matchesAny(a.current_company, filters.companies)) return false;
    if (from !== undefined || to !== undefined) {
      const year = Number(a.graduation_year);
      if (!a.graduation_year || Number.isNaN(year)) return false;
      if (from !== undefined && year < from) return false;
      if (to !== undefined && year > to) return false;
    }
    return true;
  });
}
