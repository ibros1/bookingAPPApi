import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "../src/generated/prisma";
import { authRequest } from "../types/request";

const prisma = new PrismaClient();
export const authorize = (roles: string[]) => {
  return async (req: authRequest, res: Response, next: NextFunction) => {
    const user = await prisma.user.findFirst({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      res.status(401).json({
        isSuccess: false,
        message: "anAuthorized",
      });
      return;
    }

    if (roles.includes(user.role)) {
      next();
      return;
    }

    res.status(400).json({
      isSuccess: false,
      message: "Access denied. you are not admin!!",
    });
    return;
  };
};
