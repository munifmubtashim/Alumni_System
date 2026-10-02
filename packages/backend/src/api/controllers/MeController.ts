import { Request, Response } from "express";
import { AppError, UserManager } from "@alumni/businesslogic";

const userManager = new UserManager();

// The caller is identified only by the verified JWT (set by authMiddleware), never by params or body.
function currentUserId(req: Request): number {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id)) throw new AppError(401, "Invalid token");
  return id;
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: "Something went wrong" });
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const profile = await userManager.getMe(currentUserId(req));
    res.status(200).json(profile);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const profile = await userManager.updateMe(currentUserId(req), req.body ?? {});
    res.status(200).json(profile);
  } catch (error) {
    sendError(res, error);
  }
};

export const changeMyPassword = async (req: Request, res: Response) => {
  try {
    await userManager.changeMyPassword(currentUserId(req), req.body ?? {});
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
};
