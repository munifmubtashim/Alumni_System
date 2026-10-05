import { Request, Response } from "express";
import { PostManager } from "@alumni/businesslogic";
import { sendError } from "./sendError";

const postManager = new PostManager();

// POST /api/posts — the author is the signed-in user, never body.user_id.
export const createPost = async (req: Request, res: Response) => {
  try {
    const newPost = await postManager.createNewPost(Number(req.user.sub), req.body ?? {});
    res.status(201).json(newPost);
  } catch (error) {
    sendError(res, error);
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const posts = await postManager.getAllPosts(limit, offset);
    res.status(200).json(posts);
  } catch (error) {
    sendError(res, error);
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await postManager.getPostsByUserId(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/posts/:id — author or admin only.
export const updatePost = async (req: Request, res: Response) => {
  try {
    const updated = await postManager.updatePost(
      { id: Number(req.user.sub), role: req.user.role },
      req.params.id,
      req.body ?? {},
    );
    res.status(200).json(updated);
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/posts/:id — author or admin only.
export const deletePost = async (req: Request, res: Response) => {
  try {
    await postManager.deletePost({ id: Number(req.user.sub), role: req.user.role }, req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
};
