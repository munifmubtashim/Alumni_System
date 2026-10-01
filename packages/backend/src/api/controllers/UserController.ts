import { Request, Response } from "express";
import { AppError, UserManager } from "@alumni/businesslogic";
import { UserDTO } from "@alumni/dal";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userManager = new UserManager();
const JWT_SECRET = process.env.JWT_SECRET as string;
export async function login(email: string, password: string) {
  const user = await userManager.findUserByEmail(email);
  if (!user) throw { status: 401, message: "Invalid" };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: "Invalid" };

  return { token: signToken(user) };
}

function signToken(user: { id: number; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
}

// Public self-registration: always creates an alumni account and logs it in.
export const registerAlumni = async (req: Request, res: Response) => {
  try {
    const input = userManager.validateRegistration(req.body ?? {});
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userManager.registerAlumni(input, passwordHash);
    res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Registration failed" });
  }
};

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string };
}



export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, photo_url } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserDTO(name, email, hashedPassword, role, photo_url);
    const newUser = await userManager.createUser(user);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userManager.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    const user = await userManager.findUserById(Number(req.params.id));
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const findUserByEmail = async (req: Request, res: Response) => {
  try {
    const user = await userManager.findUserByEmail(req.params.email);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

// Owner-only (requires authMiddleware): changes name/photo of the caller's own account.
export const updateUser = async (req: Request, res: Response) => {
  try {
    const updated = await userManager.updateOwnUser(Number(req.user.sub), req.params.id, req.body ?? {});
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userManager.deleteUser(Number(req.params.id));
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateLoginTime = async (req: Request, res: Response) => {
  try {
    await userManager.updateLoginTime(Number(req.params.id));
    res.status(200).json({ message: "Login time updated" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateLogoutTime = async (req: Request, res: Response) => {
  try {
    await userManager.updateLogoutTime(Number(req.params.id));
    res.status(200).json({ message: "Logout time updated" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
