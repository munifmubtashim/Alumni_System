import { Router } from "express";
import {
  createAlumni,
  getAllAlumni,
  findAlumniById,
  findAlumniByEmail,
  updateAlumni,
} from "../controllers/AlumniController";

const router = Router();

router.post("/", createAlumni);
router.get("/", getAllAlumni);
router.get("/:id", findAlumniById);
router.get("/email/:email", findAlumniByEmail);
router.put("/:id", updateAlumni);

export default router;
