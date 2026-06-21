import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PostManager, CommentManager, AlumniManager, UserManager } from "@alumni/businesslogic";

dotenv.config({ path: '../../.env' });

const app = express();

const postManager = new PostManager();
const commentManager = new CommentManager();
const alumniManager = new AlumniManager();
const userManager = new UserManager();

app.use(cors());
app.use(express.json());


app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postManager.getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    const comments = await commentManager.getAllComments();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/alumni', async (req, res) => {
  try {
    const alumni = await alumniManager.getAllAlumni();
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await userManager.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default app;