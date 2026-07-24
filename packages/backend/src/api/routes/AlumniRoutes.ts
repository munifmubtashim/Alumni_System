import { Router } from "express";
import {
  createAlumni,
  getAllAlumni,
  findAlumniById,
  findAlumniByEmail,
  updateAlumni,
} from "../controllers/AlumniController";
import { authMiddleware } from "../Middleware/authMIddleware";

const router = Router();

router.post("/", createAlumni);
router.get("/", getAllAlumni);
router.get("/:id", authMiddleware, findAlumniById);
router.get("/email/:email", findAlumniByEmail);
router.put("/:id", updateAlumni);

export default router;
