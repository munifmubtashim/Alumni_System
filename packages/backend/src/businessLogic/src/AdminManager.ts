import { AdminQuery, AlumniQuery } from "@alumni/dal";
import type { AdminStatsRow, AlumniDTO } from "@alumni/dal";
import { AppError, isForeignKeyViolation } from "./errors.js";
import { UserManager } from "./UserManager.js";
import { requiredEmail, requireId, validateAdminAlumniFields, validateNewPassword } from "./validation.js";

// Admin-only alumni management (/api/admin/*). The router already requires an admin token;
// the rules about which account may be changed live here.
export class AdminManager {
  adminQuery: AdminQuery;
  alumniQuery: AlumniQuery;
  userManager: UserManager;

  constructor() {
    this.adminQuery = new AdminQuery();
    this.alumniQuery = new AlumniQuery();
    this.userManager = new UserManager();
  }

  // GET /api/admin/stats: alumni rows, student rows, posts, alumni available for mentorship.
  public async getStats(): Promise<AdminStatsRow> {
    return this.adminQuery.countStats();
  }

  // POST /api/admin/alumni: a new alumni account (role always 'alumni') with a temporary password.
  // Returns the new alumni row (id = alumni id, joined name), the shape the admin table shows.
  public async createAlumni(body: Record<string, unknown>): Promise<AlumniDTO> {
    const fields = validateAdminAlumniFields(body);
    const email = requiredEmail(body.email);
    const password = validateNewPassword(body.password, "Temporary password");
    // Hashing and the taken-email 409 are UserManager's (one owner for password storage).
    const created = await this.userManager.createAlumniAccount(
      { name: fields.name, email, password, university: fields.university },
      {
        department: fields.department,
        graduation_year: fields.graduation_year,
        job_title: fields.job_title,
        current_company: fields.current_company,
      },
    );
    const userId = created.id;

    // createAlumniAccount returns the users row; the table needs the alumni row, found by user id.
    const alumni = await this.alumniQuery.findAlumniByUserId(userId);
    const row = alumni && (await this.alumniQuery.findAlumniById(alumni.id));
    if (!row) throw new Error(`Alumni row missing after creating user ${userId}`);
    return row;
  }

  // PUT /api/admin/alumni/:id (alumni id). Sets name, university, graduation year, department, job title
  // and company only; every other column, and email/role/password/user_id in the body, are left alone.
  public async updateAlumni(alumniId: unknown, body: Record<string, unknown>): Promise<AlumniDTO> {
    const id = requireId(alumniId, "Alumni");
    const existing = await this.alumniQuery.findAlumniById(id);
    if (!existing) throw new AppError(404, "Alumni not found");
    const fields = validateAdminAlumniFields(body);
    const updated = await this.adminQuery.updateAlumniAccount(id, fields);
    if (!updated) throw new AppError(404, "Alumni not found");
    const row = await this.alumniQuery.findAlumniById(id);
    if (!row) throw new AppError(404, "Alumni not found");
    return row;
  }

  // DELETE /api/admin/alumni/:id (alumni id): removes the person's account and everything they wrote.
  // `requesterId` is the admin's user id from the token; an admin can't delete their own account here.
  public async deleteAlumni(requesterId: number, alumniId: unknown): Promise<void> {
    const id = requireId(alumniId, "Alumni");
    const existing = await this.alumniQuery.findAlumniById(id);
    if (!existing) throw new AppError(404, "Alumni not found");
    if (existing.user_id === requesterId) throw new AppError(403, "You can't delete your own account");

    let deleted: boolean;
    try {
      deleted = await this.adminQuery.deleteAlumniAccount(existing.user_id);
    } catch (error) {
      // Only if a foreign key doesn't cascade on this database; the transaction rolled back.
      if (isForeignKeyViolation(error)) throw new AppError(409, "This user still has posts or comments");
      throw error;
    }
    if (!deleted) throw new AppError(404, "Alumni not found");
  }
}
