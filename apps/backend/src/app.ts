import pool from './db';

 pool.query('SELECT NOW()')
 .then(() => console.log('DATABASE CONNECTED'))
 .catch((err) => console.error('connection failed',err));
 