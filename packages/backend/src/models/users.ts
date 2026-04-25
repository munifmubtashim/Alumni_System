import pool from '../db';


export async function createUser(name: string, email: string,password: string, role: string) {
    const info = await pool.query('INSERT INTO users (name , email , password, role) VALUES ($1,$2,$3,$4) RETURNING *',
    [name,email,password,role]
    );
    return info.rows[0]
}

export async function findUserByEmail(email:string){
    const info = await pool.query('SELECT * FROM users WHERE email = $1',
        [email]
    );
    return info.rows[0];
}
