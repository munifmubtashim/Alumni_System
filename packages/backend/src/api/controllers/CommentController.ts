import { Request, Response } from "express";
import { CommentManager } from "@alumni/businesslogic";
import { CommentDTO } from "@alumni/dal";

const commentManager = new CommentManager();

export const createComment = async (req: Request, res: Response) => {
  try {
    const { user_id, post_id, content, parent_id } = req.body;
    const comment = new CommentDTO(user_id, post_id, content, parent_id);
    const newComment = await commentManager.createComment(comment);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await commentManager.getAllComments();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { user_id, post_id, content } = req.body;
    const comment = new CommentDTO(user_id, post_id, 0, content);
    comment.id = Number(req.params.id);
    const updated = await commentManager.updateComment(comment);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const comment = new CommentDTO(0,0, 0, '');
 
    comment.id = Number(req.params.id);
    await commentManager.deleteComment(comment);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};