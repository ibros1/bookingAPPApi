import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/config";
import { authRequest } from "../types/request";

export const authenticateUser = (
  req: authRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req?.headers?.authorization;

    if (!authHeader) {
      res.status(401).json({
        isSuccess: false,
        message: "no token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        isSuccess: false,
        message: "no token provided",
      });
      return;
    }

    const result: any = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    req.userId = result.userId;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      isSuccess: false,
      message: "server error",
    });
  }
};
