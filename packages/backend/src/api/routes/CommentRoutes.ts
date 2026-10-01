import { Router } from "express";
import { deleteComment } from "../controllers/CommentController";
import { authMiddleware } from "../Middleware/authMIddleware";

// Listing and creating comments live under /api/posts/:id/comments (see PostRoutes).
const router = Router();

router.delete("/:id", authMiddleware, deleteComment);

export default router;
