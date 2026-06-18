import { AlumniDTO, AlumniQuery } from "@alumni/dal";

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

  public async updateAlumni(id: number, alumni: Partial<AlumniDTO>) {
    const updatedAlumni = await this.alumniQuery.updateAlumni(id, alumni);
    return updatedAlumni;
  }

  public async getAllAlumni() {
    const allAlumni = await this.alumniQuery.getAllAlumnil();
    return allAlumni;
  }
}
