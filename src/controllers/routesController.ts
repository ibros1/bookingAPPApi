import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { iCreatedRoute, iUpdatedRoute } from "../../types/routesRide";

const prisma = new PrismaClient();

// CREATE ROUTE
export const createRoute = async (req: Request, res: Response) => {
  try {
    const data: iCreatedRoute = req.body;

    if (!data.userId || !data.from || !data.end) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "All fields are required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });
    if (!user) {
      res.status(404).json({
        isSuccess: false,
        message: "user not found!",
      });
      return;
    }

    const route = await prisma.route.create({ data });
    res
      .status(201)
      .json({ isSuccess: true, message: "Route created successfully", route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// GET ALL ROUTES
export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.limit as string) || 10);

    // Fetch routes with pagination
    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          createdUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              address: true,
            },
          },
        }, // include user details
        orderBy: { updatedAt: "desc" }, // optional: latest updated first
      }),
      prisma.route.count(),
    ]);

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      isSuccess: true,
      routes,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
// GET ONE ROUTE
export const getOneRoute = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        createdUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            address: true,
          },
        },
      },
    });

    if (!route)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Route not found" });

    res.status(200).json({ isSuccess: true, route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// UPDATE ROUTE
export const updateRoute = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedRoute = req.body;

    if (!data.id)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Route ID is required" });

    const route = await prisma.route.findUnique({ where: { id: data.id } });
    if (!route)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Route not found" });

    const updatedRoute = await prisma.route.update({
      where: { id: data.id },
      data,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Route updated successfully",
      route: updatedRoute,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// DELETE ROUTE
export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Route not found" });

    await prisma.route.delete({ where: { id: routeId } });

    res
      .status(200)
      .json({ isSuccess: true, message: "Route deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
