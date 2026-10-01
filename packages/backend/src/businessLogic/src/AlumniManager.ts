import { AlumniDTO, AlumniQuery } from "@alumni/dal";
import { AppError } from "./errors.js";
import { requireId, validateAlumniFields } from "./validation.js";

export class AlumniManager {
  alumniQuery: AlumniQuery;

  constructor() {
    this.alumniQuery = new AlumniQuery();
  }
  public async createAlumni(alumni: AlumniDTO) {
    const newAlumni = await this.alumniQuery.createAlumni(alumni);
    return newAlumni;
  }

  public async findAlumniByEmail(email: string) {
    const alumni = await this.alumniQuery.findAlumniByEmail(email);
    return alumni;
  }

  public async findAlumniById(id: number) {
    const alumni = await this.alumniQuery.findAlumniById(id);
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

  public async getAllAlumni() {
    const allAlumni = await this.alumniQuery.getAllAlumnil();
    return allAlumni;
  }
}
