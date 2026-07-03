import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostsByUserId,
  updatePost,
  deletePost,
} from "../controllers/PostController";

const router = Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/user/:id", getPostsByUserId);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
