import { Router } from "express";
import { createComment, getAllComments, updateComment, deleteComment } from "../controllers/CommentController";

const router = Router();

router.post("/", createComment);
router.get("/", getAllComments);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;