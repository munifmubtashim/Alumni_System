import { login } from "../controllers/UserController";
import { Router } from "express";


const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message });
  }
});
export default router;