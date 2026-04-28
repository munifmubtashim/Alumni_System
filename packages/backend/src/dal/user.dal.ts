import pool from '../config/db';
import {User,CreateUserInput} from "@alumni/shared";

export async function createUserDal(data: CreateUserInput): Promise<User> {
    const info = await pool.query('INSERT INTO users (name , email , password, role) VALUES ($1,$2,$3,$4) RETURNING *',
    [data.name,data.email,data.password,data.role]
    );
    return info.rows[0]
}

export async function findUserByEmailDal(email:string): Promise<User | undefined> {
    const info = await pool.query('SELECT * FROM users WHERE email = $1',
        [email]
    );
    return info.rows[0];
}

export async function findUserByIdDal(id:number): Promise<User> {
    const info = await pool.query('SELECT * FROM users WHERE id = $1',
        [id]
    );
    return info.rows[0];
    
}
export async function updateUserDal(id: number, data: Partial<User>): Promise<User> {
    const info = await pool.query(
        `UPDATE users SET name=$1, photo_url=$2, password=$3,email=$4, updated_at=NOW() WHERE id=$4 RETURNING *`,
        [data.name, data.photo_url, data.password,data.email, id]
    );
    return info.rows[0];
}
export async function getAllUsersDal(): Promise<User[]> {
    const info = await pool.query('SELECT * FROM users');
    return info.rows;
}
export async function deleteUserDal(id: number): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
}
export async function updateLoginTimeDal(id: number): Promise<void> {
    await pool.query('UPDATE users SET login_at=NOW() WHERE id=$1', [id]);
}

export async function updateLogoutTimeDal(id: number): Promise<void> {
    await pool.query('UPDATE users SET logout_at=NOW() WHERE id=$1', [id]);
}