import { AlumniDTO, AlumniQuery } from "@alumni/dal";
import { AppError, isUniqueViolation } from "./errors.js";
import { parseAlumniSearch, requireId, validateAlumniFields } from "./validation.js";

export class AlumniManager {
  alumniQuery: AlumniQuery;

  constructor() {
    this.alumniQuery = new AlumniQuery();
  }

  // POST /api/alumni: creates the caller's own profile. `userId` comes from the token, never the body.
  public async createAlumni(userId: number, body: Record<string, unknown>) {
    const existing = await this.alumniQuery.findAlumniByUserId(userId);
    if (existing) throw new AppError(409, "You already have an alumni profile");
    const f = validateAlumniFields(body);
    // validateAlumniFields returns years as text; the columns are INTEGER, so pass numbers.
    const alumni = new AlumniDTO({
      ...f,
      user_id: userId,
      graduation_year: f.graduation_year === undefined ? undefined : Number(f.graduation_year),
      start_year: f.start_year === undefined ? undefined : Number(f.start_year),
    });
    try {
      return await this.alumniQuery.createAlumni(alumni);
    } catch (error) {
      // alumni.user_id is UNIQUE: a concurrent create for the same user lands here.
      if (isUniqueViolation(error)) {
        throw new AppError(409, "You already have an alumni profile");
      }
      throw error;
    }
  }

  // GET /api/alumni/:id. A malformed or unknown id is 404.
  public async findAlumniById(id: unknown) {
    const alumni = await this.alumniQuery.findAlumniById(requireId(id, "Alumni"));
    if (!alumni) throw new AppError(404, "Alumni not found");
    return alumni;
  }

  // PUT /api/alumni/:id: only the row's owner may edit it (admins included). user_id can't change.
  public async updateOwnAlumni(requesterId: number, alumniId: unknown, body: Record<string, unknown>) {
    const id = requireId(alumniId, "Alumni");
    const existing = await this.alumniQuery.findAlumniById(id);
    if (!existing) throw new AppError(404, "Alumni not found");
    if (existing.user_id !== requesterId) throw new AppError(403, "You can only edit your own profile");
    return this.alumniQuery.updateAlumni(id, validateAlumniFields(body));
  }

  // GET /api/alumni: validates the raw query string first (AppError 400), so bad input never reaches SQL.
  public async searchAlumni(query: Record<string, unknown>) {
    const { filters, page, pageSize } = parseAlumniSearch(query);
    return this.alumniQuery.searchAlumni(filters, { limit: pageSize, offset: (page - 1) * pageSize });
  }
}
