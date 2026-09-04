import { Request, Response } from "express";
import { PostManager } from "@alumni/businesslogic";
import { PostDTO } from "@alumni/dal";

const postManager = new PostManager();

export const createPost = async (req: Request, res: Response) => {
  try {
    const { user_id, caption, media_url } = req.body;
    const post = new PostDTO(user_id, 0, caption, media_url);
    const newPost = await postManager.createNewPost(post);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const posts = await postManager.getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const post = new PostDTO(Number(req.params.id), 0);
    const posts = await postManager.getPostsByUserId(post);
    res.status(200).json(posts);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { user_id, caption, media_url } = req.body;
    const post = new PostDTO(user_id, 0, caption, media_url);
    post.id = Number(req.params.id);
    const updated = await postManager.updatePost(post);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = new PostDTO(0, 0);
    post.id = Number(req.params.id);
    await postManager.deletePost(post);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};