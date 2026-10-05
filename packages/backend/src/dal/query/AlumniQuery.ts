import pool from "../config/db";
import { AlumniDTO } from "../dto/AlumniDTO.js";

// Public user columns joined onto alumni rows. Email is only exposed on single-profile reads.
const LIST_COLUMNS = "a.*, u.name, u.photo_url, u.university";
const PROFILE_COLUMNS = "a.*, u.name, u.email, u.photo_url, u.university";

export class AlumniQuery {
  constructor() { }

  public async createAlumni(alumni: AlumniDTO): Promise<AlumniDTO> {
    const info = await pool.query(
      "INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        alumni.user_id,
        alumni.department,
        alumni.graduation_year,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
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
    alumni: Partial<AlumniDTO>,
  ): Promise<AlumniDTO> {
    const info = await pool.query(
      `UPDATE alumni SET department=$1 ,graduation_year=$2 ,  current_company=$3 ,job_title=$4 ,experience=$5 ,bio=$6 ,linkedin_url=$7 , updated_at=NOW() WHERE id=$8 RETURNING *`,
      [
        alumni.department,
        alumni.graduation_year,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
        id
      ],
    );
    return info.rows[0];
  }

  public async getAllAlumnil(): Promise<AlumniDTO[]> {
    const info = await pool.query(
      `SELECT ${LIST_COLUMNS} FROM alumni a JOIN users u ON a.user_id = u.id ORDER BY u.name`
    );
    return info.rows;
  }
}
