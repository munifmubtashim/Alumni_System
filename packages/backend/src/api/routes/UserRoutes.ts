import { Router } from "express";
import {
  createUser,
  getAllUsers,
  findUserById,
  updateUser,
  deleteUser,
} from "../controllers/UserController";
import { authMiddleware } from "../Middleware/authMIddleware";
import { requireRole } from "../Middleware/roleMiddleware";

const router = Router();

// Every route here needs a signed-in user; admin-only ones add requireRole.
router.use(authMiddleware);
router.post("/", requireRole("admin"), createUser);
router.get("/", requireRole("admin"), getAllUsers);
router.get("/:id", findUserById);
router.put("/:id", updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

export default router;
