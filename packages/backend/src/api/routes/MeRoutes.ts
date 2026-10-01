import { Router } from "express";
import { getMe, updateMe } from "../controllers/MeController";
import { authMiddleware } from "../Middleware/authMIddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMe);
router.put("/", updateMe);

export default router;
