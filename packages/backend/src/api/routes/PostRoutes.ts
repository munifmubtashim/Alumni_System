import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostsByUserId,
  updatePost,
  deletePost,
} from "../controllers/PostController";
import { addComment, getPostComments } from "../controllers/CommentController";
import { authMiddleware } from "../Middleware/authMIddleware";

const router = Router();

// Every route here needs a signed-in user; ownership is checked in PostManager.
router.use(authMiddleware);
router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/user/:id", getPostsByUserId);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

router.get("/:id/comments", getPostComments);
router.post("/:id/comments", addComment);

export default router;
