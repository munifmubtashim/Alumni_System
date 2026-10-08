import { Router } from "express";
import { deleteComment, updateComment } from "../controllers/CommentController";
import { authMiddleware } from "../Middleware/authMIddleware";

// Listing and creating comments live under /api/posts/:id/comments (see PostRoutes).
const router = Router();

router.use(authMiddleware);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
