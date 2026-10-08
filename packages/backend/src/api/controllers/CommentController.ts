import { Request, Response } from "express";
import { CommentManager } from "@alumni/businesslogic";
import { sendError } from "./sendError";

const commentManager = new CommentManager();

// GET /api/posts/:id/comments
export const getPostComments = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await commentManager.getCommentsForPost(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/posts/:id/comments (requires authMiddleware)
export const addComment = async (req: Request, res: Response) => {
  try {
    const comment = await commentManager.addComment(Number(req.user.sub), req.params.id, req.body ?? {});
    res.status(201).json(comment);
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/comments/:id (requires authMiddleware)
export const updateComment = async (req: Request, res: Response) => {
  try {
    const comment = await commentManager.updateComment(
      { id: Number(req.user.sub), role: req.user.role },
      req.params.id,
      req.body ?? {},
    );
    res.status(200).json(comment);
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/comments/:id (requires authMiddleware)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    await commentManager.deleteComment({ id: Number(req.user.sub), role: req.user.role }, req.params.id);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
};
