import { Router } from "express";
import {
  createAlumni,
  searchAlumni,
  findAlumniById,
  updateAlumni,
} from "../controllers/AlumniController";
import { authMiddleware } from "../Middleware/authMIddleware";
import { requireRole } from "../Middleware/roleMiddleware";

const router = Router();

// Every route here needs a signed-in user. Only alumni may create (their own) profile.
router.use(authMiddleware);
router.post("/", requireRole("alumni"), createAlumni);
router.get("/", searchAlumni);
router.get("/:id", findAlumniById);
router.put("/:id", updateAlumni);

export default router;
