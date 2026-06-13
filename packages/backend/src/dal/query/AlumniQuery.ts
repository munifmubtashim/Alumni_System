import pool from "../config/db.js";
import { AlumniDTO } from "../dto/AlumniDTO.js";

export class AlumniQuery {
  constructor() { }

  public async createAlumni(alumni: AlumniDTO): Promise<AlumniDTO> {
    const info = await pool.query(
      "INSERT INTO users (user_id,department,graduation_yr,  current_company,job_title,experience,bio,linkedin_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        alumni.user_id,
        alumni.department,
        alumni.graduation_yr,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
      ],
    );
    return info.rows[0];
  }
  public async findAlumniByEmail(
    email: string,
  ): Promise<AlumniDTO | undefined> {
    const info = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return info.rows[0];
  }

  public async findAlumniById(id: number): Promise<AlumniDTO> {
    const info = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return info.rows[0];
  }

  public async updateAlumni(
    id: number,
    alumni: Partial<AlumniDTO>,
  ): Promise<AlumniDTO> {
    const info = await pool.query(
      `UPDATE users SET department=$1 ,graduation_yr=$2 ,  current_company=$3 ,job_title=$4 ,experience=$5 ,bio=$6 ,linkedin_url=$7 , updated_at=NOW() WHERE id=$8 RETURNING *`,
      [
        alumni.department,
        alumni.graduation_yr,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
      ],
    );
    return info.rows[0];
  }

  public async getAllAlumnil(): Promise<AlumniDTO[]> {
    const info = await pool.query("SELECT * FROM users");
    return info.rows;
  }
}
