import pool from '../config/db';

import { User } from '@alumni/shared';

export async function createUserDal(name: string, email: string,password: string, role: string): Promise<User> {
    const info = await pool.query('INSERT INTO users (name , email , password, role) VALUES ($1,$2,$3,$4) RETURNING *',
    [name,email,password,role]
    );
    return info.rows[0]
}

export async function findUserByEmailDal(email:string): Promise<User | undefined> {
    const info = await pool.query('SELECT * FROM users WHERE email = $1',
        [email]
    );
    return info.rows[0];
}