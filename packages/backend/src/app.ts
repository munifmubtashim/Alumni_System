import pool from './db';
import express from 'express';
import router from './routes/userRoutes';

pool.query('SELECT NOW()')
    .then(() => console.log('DATABASE CONNECTED'))
    .catch((err) => console.error('connection failed', err));

const app = express();
app.use(express.json());
app.use('/api/users', router);
app.listen(process.env.PORT);

app.get('/', (req, res) => {
    res.send('Alumni System');
});