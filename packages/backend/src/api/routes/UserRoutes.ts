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

const router = Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", findUserById);
router.get("/email/:email", findUserByEmail);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/login", updateLoginTime);
router.put("/:id/logout", updateLogoutTime);

export default router;
