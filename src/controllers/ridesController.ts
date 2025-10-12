import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// CREATE RIDE
export const createRide = async (req: Request, res: Response) => {
  try {
    const { userId, routeId, fareUSD, fareSLSH } = req.body;

    if (
      !userId ||
      !routeId ||
      fareUSD === undefined ||
      fareSLSH === undefined
    ) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "All fields are required" });
    }

    // check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    // check if route exists
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "Route not found" });
    }

    const ride = await prisma.ride.create({
      data: { userId, routeId, fareUSD, fareSLSH },
    });

    res
      .status(201)
      .json({ isSuccess: true, message: "Ride created successfully", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// GET ALL RIDES (with pagination + includes)
export const getAllRides = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.limit as string) || 10);

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              address: true,
            },
          },
          route: {
            select: {
              id: true,
              from: true,
              end: true,
            },
          },
        },
        orderBy: { id: "desc" }, // latest ride first
      }),
      prisma.ride.count(),
    ]);

    res.status(200).json({
      isSuccess: true,
      rides,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// GET ONE RIDE
export const getOneRide = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            address: true,
          },
        },
        route: {
          select: {
            id: true,
            from: true,
            end: true,
          },
        },
      },
    });

    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Ride not found" });

    res.status(200).json({ isSuccess: true, ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// UPDATE RIDE
export const updateRide = async (req: Request, res: Response) => {
  try {
    const { id, userId, routeId, fareUSD, fareSLSH } = req.body;

    if (!id)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Ride ID is required" });

    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Ride not found" });

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: { userId, routeId, fareUSD, fareSLSH },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Ride updated successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// DELETE RIDE
export const deleteRide = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Ride not found" });

    await prisma.ride.delete({ where: { id: rideId } });

    res
      .status(200)
      .json({ isSuccess: true, message: "Ride deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
