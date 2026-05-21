import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

 const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD

});

async function verifyConnection(): Promise<void> {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        client.release(); // Release the client back to the pool
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

verifyConnection();

export default pool;