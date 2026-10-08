import pool from "../config/db";
import { AlumniDTO } from "../dto/AlumniDTO.js";
import type { AlumniEditableFields } from "../dto/RegisterDTO.js";
import type { AlumniListPage, AlumniPaging, AlumniSearchFilters, AlumniSort, SortOrder } from "../dto/AlumniSearchDTO.js";

// Public user columns joined onto alumni rows. Email is only exposed on single-profile reads.
const LIST_COLUMNS = "a.*, u.name, u.photo_url, u.university";
const PROFILE_COLUMNS = "a.*, u.name, u.email, u.photo_url, u.university";
const LIST_FROM = "FROM alumni a JOIN users u ON a.user_id = u.id";

// The only ORDER BY texts the directory list can send: a fixed lookup, so no request text reaches the SQL.
// Each ends in a.id, a unique tie-break, so offset pages never overlap. No sort keeps the original order.
const DEFAULT_ORDER_BY = "u.name, a.id";
const ORDER_BY: Record<AlumniSort, Record<SortOrder, string>> = {
  name: { asc: "u.name ASC, a.id ASC", desc: "u.name DESC, a.id DESC" },
  graduationYear: {
    asc: "a.graduation_year ASC NULLS LAST, u.name, a.id",
    desc: "a.graduation_year DESC NULLS LAST, u.name, a.id",
  },
};

// GET /api/alumni/suggestions. The CTE reads the caller's department (their alumni row, else their
// students row) and university; blank counts as missing. Each "same" flag is COALESCE(..., false):
// a NULL comparison would sort FIRST under DESC and rank people with no department above real
// department-mates (ADV-001). $1 = caller's user id, $2 = limit.
const SUGGEST_SQL = `WITH me AS (
  SELECT COALESCE(NULLIF(ca.department, ''), NULLIF(cs.department, '')) AS department,
         NULLIF(cu.university, '') AS university
  FROM users cu
  LEFT JOIN alumni ca ON ca.user_id = cu.id
  LEFT JOIN students cs ON cs.user_id = cu.id
  WHERE cu.id = $1
  LIMIT 1
)
SELECT ${LIST_COLUMNS} ${LIST_FROM}
LEFT JOIN me ON true
WHERE a.user_id <> $1
ORDER BY COALESCE(lower(a.department) = lower(me.department), false) DESC,
  COALESCE(lower(u.university) = lower(me.university), false) DESC,
  u.name, a.id
LIMIT $2`;

function orderByFor(sort: AlumniSort | undefined, order: SortOrder | undefined): string {
  if (sort === undefined) return DEFAULT_ORDER_BY;
  return ORDER_BY[sort][order ?? "asc"];
}

// Makes %, _ and \ match literally in a LIKE/ILIKE pattern. Backslash is Postgres's default
// LIKE escape character, so the SQL carries no ESCAPE clause (ESCAPE '\' inside a JS template
// literal would be sent as ESCAPE '', which Postgres rejects).
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export class AlumniQuery {
  constructor() { }

  public async createAlumni(alumni: AlumniDTO): Promise<AlumniDTO> {
    const info = await pool.query(
      `INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url,
         headline, location, degree, start_year, mentorship_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        alumni.user_id,
        alumni.department,
        alumni.graduation_year,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
        alumni.headline ?? null,
        alumni.location ?? null,
        alumni.degree ?? null,
        alumni.start_year ?? null,
        // The column is NOT NULL: a DTO without the flag stores false, never null.
        alumni.mentorship_available ?? false,
      ],
    );
    return info.rows[0];
  }
  // The caller's own alumni row, if any (one profile per user on create).
  public async findAlumniByUserId(userId: number): Promise<AlumniDTO | undefined> {
    const info = await pool.query("SELECT * FROM alumni WHERE user_id = $1 ORDER BY id LIMIT 1", [userId]);
    return info.rows[0];
  }

  public async findAlumniById(id: number): Promise<AlumniDTO> {
    const info = await pool.query(
      `SELECT ${PROFILE_COLUMNS} FROM alumni a JOIN users u ON a.user_id = u.id WHERE a.id = $1`,
      [id]
    );
    return info.rows[0];
  }

  public async updateAlumni(
    id: number,
    alumni: AlumniEditableFields,
  ): Promise<AlumniDTO> {
    const info = await pool.query(
      `UPDATE alumni SET department=$1, graduation_year=$2, current_company=$3, job_title=$4, experience=$5, bio=$6,
         linkedin_url=$7, headline=$8, location=$9, degree=$10, start_year=$11, mentorship_available=$12,
         updated_at=NOW() WHERE id=$13 RETURNING *`,
      [
        alumni.department,
        alumni.graduation_year,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
        alumni.headline ?? null,
        alumni.location ?? null,
        alumni.degree ?? null,
        alumni.start_year ?? null,
        alumni.mentorship_available,
        id
      ],
    );
    return info.rows[0];
  }

  // Searched, filtered, paged directory list. Fragments are constants; every input value is a
  // bound parameter, so no request text ever reaches the SQL string.
  public async searchAlumni(filters: AlumniSearchFilters, paging: AlumniPaging): Promise<AlumniListPage> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    const next = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filters.q !== undefined) {
      const p = next(`%${escapeLike(filters.q)}%`);
      conditions.push(`(u.name ILIKE ${p} OR a.current_company ILIKE ${p} OR a.job_title ILIKE ${p})`);
    }
    if (filters.department !== undefined) {
      conditions.push(`lower(a.department) = lower(${next(filters.department)})`);
    }
    if (filters.university !== undefined) {
      conditions.push(`lower(u.university) = lower(${next(filters.university)})`);
    }
    if (filters.graduationYear !== undefined) {
      conditions.push(`a.graduation_year = ${next(filters.graduationYear)}`);
    }
    if (filters.mentorship === true) {
      conditions.push(`a.mentorship_available = ${next(true)}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countParams = [...params];
    const limit = next(paging.limit);
    const offset = next(paging.offset);
    const orderBy = orderByFor(filters.sort, filters.order);

    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT ${LIST_COLUMNS} ${LIST_FROM} ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
      pool.query(`SELECT COUNT(*)::int AS total ${LIST_FROM} ${where}`, countParams),
    ]);

    return { items: itemsResult.rows, total: countResult.rows[0]?.total ?? 0 };
  }

  // Up to `limit` other alumni: same department first, then same university, then by name.
  // The caller is never in the list (matched by user id, so it works for students too).
  public async suggestAlumni(userId: number, limit: number): Promise<AlumniDTO[]> {
    const info = await pool.query(SUGGEST_SQL, [userId, limit]);
    return info.rows;
  }
}
