import { login, register } from "../controllers/UserController";
import { sendError } from "../controllers/sendError";
import { Router } from "express";


const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    // Wrong email/password is an AppError(401, "Invalid"); anything else becomes a plain 500.
    sendError(res, err);
  }
});
router.post("/register", register);

export default router;