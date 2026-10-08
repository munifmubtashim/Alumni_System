import { Router } from "express";
import { createAlumni, deleteAlumni, getStats, updateAlumni } from "../controllers/AdminController";
import { authMiddleware } from "../Middleware/authMIddleware";
import { requireRole } from "../Middleware/roleMiddleware";

const router = Router();

// Admin-only namespace: every route added here needs an admin token, by construction.
router.use(authMiddleware, requireRole("admin"));
router.get("/stats", getStats);
router.post("/alumni", createAlumni);
router.put("/alumni/:id", updateAlumni);
router.delete("/alumni/:id", deleteAlumni);

export default router;
