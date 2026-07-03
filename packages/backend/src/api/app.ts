import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import alumniRoutes from './routes/AlumniRoutes';
import postRoutes from './routes/PostRoutes';
import commentRoutes from './routes/CommentRoutes';
import userRoutes from './routes/UserRoutes';

dotenv.config({ path: '../../.env' });

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use('/api/users', userRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

export default app;