import pool from "../config/db.js";
import { UserDTO } from "../dto/UserDTO.js";
import type { AlumniEditableFields, AlumniProfileFields, MyProfileRow, PublicUserRow, RegisterUserFields, StudentEditableFields, StudentProfileFields, UserBasicsFields } from "../dto/RegisterDTO.js";


export class UserQuery {
    constructor() {

    }

    public async createUser(data: UserDTO): Promise<UserDTO> {
        const info = await pool.query('INSERT INTO users (name , email , password, role) VALUES ($1,$2,$3,$4) RETURNING *',
            [data.name, data.email, data.password, data.role]
        );
        return info.rows[0]

    }
    public async findUserByEmail(email: string): Promise<UserDTO | undefined> {
        const info = await pool.query('SELECT * FROM users WHERE email = $1',
            [email]
        );
        return info.rows[0];
    }

    public async findUserById(id: number): Promise<UserDTO> {
        const info = await pool.query('SELECT * FROM users WHERE id = $1',
            [id]
        );
        return info.rows[0];

    }


    public async getAllUsers(): Promise<UserDTO[]> {
        const info = await pool.query('SELECT * FROM users');
        const users: UserDTO[] = [];
        for (const user of info.rows) {
            console.log(user);
            users.push(user);
        }

        return info.rows;
    }
    public async deleteUser(id: number): Promise<void> {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
    }
    public async updateLoginTime(id: number): Promise<void> {
        await pool.query('UPDATE users SET login_at=NOW() WHERE id=$1', [id]);
    }
    public async updateLogoutTime(id: number): Promise<void> {
        await pool.query('UPDATE users SET logout_at=NOW() WHERE id=$1', [id]);
    }

    // Creates the user (role always 'alumni') and their alumni row atomically.
    public async createAlumniUser(user: RegisterUserFields, profile: AlumniProfileFields): Promise<PublicUserRow> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const userResult = await client.query(
                `INSERT INTO users (name, email, password, role, university) VALUES ($1, $2, $3, 'alumni', $4)
                 RETURNING ${UserQuery.PUBLIC_USER_COLUMNS}`,
                [user.name, user.email, user.password, user.university]
            );
            const newUser: PublicUserRow = userResult.rows[0];
            await client.query(
                `INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, linkedin_url)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    newUser.id,
                    profile.department ?? null,
                    profile.graduation_year ?? null,
                    profile.current_company ?? null,
                    profile.job_title ?? null,
                    profile.linkedin_url ?? null
                ]
            );
            await client.query('COMMIT');
            return newUser;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Creates the user (role always 'student') and their students row atomically.
    public async createStudentUser(user: RegisterUserFields, profile: StudentProfileFields): Promise<PublicUserRow> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const userResult = await client.query(
                `INSERT INTO users (name, email, password, role, university) VALUES ($1, $2, $3, 'student', $4)
                 RETURNING ${UserQuery.PUBLIC_USER_COLUMNS}`,
                [user.name, user.email, user.password, user.university]
            );
            const newUser: PublicUserRow = userResult.rows[0];
            await client.query(
                'INSERT INTO students (user_id, department, expected_graduation_year) VALUES ($1, $2, $3)',
                [newUser.id, profile.department ?? null, profile.expected_graduation_year ?? null]
            );
            await client.query('COMMIT');
            return newUser;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private static readonly PUBLIC_USER_COLUMNS = 'id, name, email, role, photo_url, university, created_at';

    // users row + their first alumni row and their students row (if any). Never selects the password.
    private static readonly MY_PROFILE_SQL = `
        SELECT u.id AS user_id, u.name, u.email, u.photo_url, u.role, u.university,
               u.created_at, u.login_at,
               a.id AS alumni_id, (a.id IS NOT NULL) AS has_alumni_profile,
               s.id AS student_id, (s.id IS NOT NULL) AS has_student_profile,
               COALESCE(a.department, s.department) AS department, s.expected_graduation_year,
               a.graduation_year,
               COALESCE(a.current_company, s.current_company) AS current_company,
               COALESCE(a.job_title, s.job_title) AS job_title,
               COALESCE(a.experience, s.experience) AS experience,
               COALESCE(a.bio, s.bio) AS bio,
               COALESCE(a.linkedin_url, s.linkedin_url) AS linkedin_url,
               GREATEST(u.updated_at, a.updated_at, s.updated_at) AS updated_at
        FROM users u
        LEFT JOIN alumni a ON a.id = (SELECT id FROM alumni WHERE user_id = u.id ORDER BY id LIMIT 1)
        LEFT JOIN students s ON s.user_id = u.id
        WHERE u.id = $1`;

    // Only for verifying the current password; never return this to a client.
    public async findPasswordHash(userId: number): Promise<string | undefined> {
        const info = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        return info.rows[0]?.password;
    }

    // `passwordHash` must already be a bcrypt hash. Returns false if the user doesn't exist.
    public async updatePassword(userId: number, passwordHash: string): Promise<boolean> {
        const info = await pool.query(
            'UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2',
            [passwordHash, userId]
        );
        return (info.rowCount ?? 0) > 0;
    }

    public async findMyProfile(userId: number): Promise<MyProfileRow | undefined> {
        const info = await pool.query(UserQuery.MY_PROFILE_SQL, [userId]);
        return info.rows[0];
    }

    // Updates the user's own name/photo/university (and email, when given) and, when given, their
    // alumni or students row, in one transaction. Returns undefined (and changes nothing) if the user doesn't exist.
    public async updateMyProfile(
        userId: number,
        basics: UserBasicsFields,
        alumni?: AlumniEditableFields,
        email?: string,
        student?: StudentEditableFields
    ): Promise<MyProfileRow | undefined> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const userResult = await client.query(
                `UPDATE users SET name=$1, photo_url=$2, university=$3, email=COALESCE($4, email), updated_at=NOW()
                 WHERE id=$5`,
                [basics.name, basics.photo_url ?? null, basics.university ?? null, email ?? null, userId]
            );
            if (userResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return undefined;
            }
            if (alumni) {
                await client.query(
                    `UPDATE alumni SET department=$1, graduation_year=$2, current_company=$3, job_title=$4,
                        experience=$5, bio=$6, linkedin_url=$7, updated_at=NOW()
                     WHERE id = (SELECT id FROM alumni WHERE user_id = $8 ORDER BY id LIMIT 1)`,
                    [
                        alumni.department ?? null,
                        alumni.graduation_year ?? null,
                        alumni.current_company ?? null,
                        alumni.job_title ?? null,
                        alumni.experience ?? null,
                        alumni.bio ?? null,
                        alumni.linkedin_url ?? null,
                        userId
                    ]
                );
            }
            if (student) {
                await client.query(
                    `UPDATE students SET department=$1, expected_graduation_year=$2, current_company=$3,
                        job_title=$4, experience=$5, bio=$6, linkedin_url=$7, updated_at=NOW()
                     WHERE user_id=$8`,
                    [
                        student.department ?? null,
                        student.expected_graduation_year ?? null,
                        student.current_company ?? null,
                        student.job_title ?? null,
                        student.experience ?? null,
                        student.bio ?? null,
                        student.linkedin_url ?? null,
                        userId
                    ]
                );
            }
            const profile = await client.query(UserQuery.MY_PROFILE_SQL, [userId]);
            await client.query('COMMIT');
            return profile.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
