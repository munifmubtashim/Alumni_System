import { Request, Response } from "express";
import { AppError, UserManager } from "@alumni/businesslogic";
import jwt from "jsonwebtoken";
import { sendError } from "./sendError";

const userManager = new UserManager();
const JWT_SECRET = process.env.JWT_SECRET as string;
export async function login(email: string, password: string) {
  const user = await userManager.verifyLogin(email, password);
  if (!user) throw new AppError(401, "Invalid");

  return { token: signToken(user) };
}

function signToken(user: { id: number; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
}

// Public self-registration: creates a student or alumni account (never admin) and logs it in.
export const register = async (req: Request, res: Response) => {
  try {
    const input = userManager.validateRegistration(req.body ?? {});
    const user = await userManager.register(input);
    res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    sendError(res, error);
  }
};

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string };
}

// Admin-only: creates an account of any role. Validates before hashing; returns no password.
export const createUser = async (req: Request, res: Response) => {
  try {
    const input = userManager.validateNewUser(req.body ?? {});
    const newUser = await userManager.createUser(input);
    res.status(201).json(newUser);
  } catch (error) {
    sendError(res, error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userManager.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    sendError(res, error);
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await userManager.findUserById(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

// Owner-only (requires authMiddleware): changes name/photo of the caller's own account.
export const updateUser = async (req: Request, res: Response) => {
  try {
    const updated = await userManager.updateOwnUser(Number(req.user.sub), req.params.id, req.body ?? {});
    res.status(200).json(updated);
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userManager.deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    sendError(res, error);
  }
};
