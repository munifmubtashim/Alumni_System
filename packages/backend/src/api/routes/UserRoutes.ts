import { Router } from "express";
import {
  createUser,
  getAllUsers,
  findUserById,
  findUserByEmail,
  updateUser,
  deleteUser,
  updateLoginTime,
  updateLogoutTime,
} from "../controllers/UserController";
import { updateAlumni } from "../controllers/AlumniController";
import { authMiddleware } from "../Middleware/authMIddleware.js";
import { requireRole } from "../Middleware/roleMiddleware";

const router = Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", findUserById);
router.get("/email/:email", findUserByEmail);
router.put("/:id", updateUser);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteUser);
router.put("/:id/login", updateLoginTime);
router.put("/:id/logout", updateLogoutTime);
router.put("/:id", authMiddleware, requireRole("admin"), updateAlumni);

export default router;
