import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export const getAllActivityLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.ceil(parseInt(req.query.page as string) || 1);
    const perPage = Math.ceil(parseInt(req.query.perPage as string) || 10);
    const [activityLogs, total] = await Promise.all([
      await prisma.activityLog.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.activityLog.count(),
    ]);
    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      isSuccess: true,
      message: "successfully fetched all activity logs",
      activityLogs,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "server error" });
  }
};
