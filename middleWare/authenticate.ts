import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Read token from cookie
    const token = req.cookies.auth_token;
    if (!token) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    req.userId = (decoded as any).userId; // attach userId to request
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ isSuccess: false, message: "Invalid token" });
  }
};
