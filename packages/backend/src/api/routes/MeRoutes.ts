import { Router } from "express";
import { changeMyPassword, getMe, updateMe } from "../controllers/MeController";
import { authMiddleware } from "../Middleware/authMIddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMe);
router.put("/", updateMe);
router.put("/password", changeMyPassword);

export default router;
