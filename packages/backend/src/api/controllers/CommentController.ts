import { Request, Response } from "express";
import { AppError, CommentManager } from "@alumni/businesslogic";

const commentManager = new CommentManager();

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: "Something went wrong" });
}

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

// DELETE /api/comments/:id (requires authMiddleware)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    await commentManager.deleteComment({ id: Number(req.user.sub), role: req.user.role }, req.params.id);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
};
