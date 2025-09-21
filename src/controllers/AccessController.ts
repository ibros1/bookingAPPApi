import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalDrivers = await prisma.user.count({
      where: { role: "DRIVER" },
    });

    const drivers = await prisma.user.findMany({
      where: { role: "DRIVER" },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            vehicleNo: true,
          },
        },
      },
      skip,
      take: limit,
    });

    if (!drivers || drivers.length === 0) {
      return res.status(404).json({
        isSuccess: false,
        message: "No drivers found!",
      });
    }

    const sanitized = drivers.map(
      ({ password, refreshToken, ...rest }) => rest
    );

    res.status(200).json({
      isSuccess: true,
      message: "Successfully fetched drivers!",
      drivers: sanitized,
      pagination: {
        total: totalDrivers,
        page,
        limit,
        totalPages: Math.ceil(totalDrivers / limit),
      },
    });
  } catch (error) {
    console.error("Get All Drivers Error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};
