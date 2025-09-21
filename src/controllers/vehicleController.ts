import { Request, Response } from "express";
import { PrismaClient, vehicleType } from "../generated/prisma/client";

import { iCreatedVehicle, iUpdatedVehicle } from "../../types/vehicle";

const prisma = new PrismaClient();
// ---------------- CREATE VEHICLE ----------------
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const data: iCreatedVehicle = req.body;

    if (
      !data.vehicleNo ||
      !Object.values(vehicleType).includes(data.name) ||
      !data.driverId
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: "Vehicle number and type are required",
      });
    }

    // Use findFirst if vehicleNo is not unique
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { vehicleNo: data.vehicleNo },
    });

    if (existingVehicle) {
      return res.status(400).json({
        isSuccess: false,
        message: "Vehicle number already exists",
      });
    }
    const typeCapacityMap: Record<vehicleType, number> = {
      Hiace: 14,
      Bus: 40,
      Taxi: 4,
      Noah: 20,
    };

    const capacity = typeCapacityMap[data.name as vehicleType];

    if (!capacity) {
      return res.status(400).json({
        isSuccess: false,
        message: "Unknown vehicle type or capacity not defined",
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNo: data.vehicleNo,
        name: data.name,
        driverId: data.driverId,
        capacity: capacity,
      },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            isDriver: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.status(201).json({
      isSuccess: true,
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- GET ALL VEHICLES ----------------
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    // Parse page and limit from query params, default to page 1, 10 per page
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.limit as string) || 10;

    const vehicles = await prisma.vehicle.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            isDriver: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const total = await prisma.vehicle.count(); // total vehicles for pagination

    res.status(200).json({
      isSuccess: true,
      message: "Vehicles fetched successfully",
      vehicles,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Get Vehicles Paginated Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- GET ONE VEHICLE ----------------
export const getOneVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        drivers: {
          select: {
            id: true,

            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            isDriver: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        isSuccess: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({ isSuccess: true, vehicle });
  } catch (error) {
    console.error("Get One Vehicle Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- UPDATE VEHICLE ----------------
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedVehicle = req.body;

    if (
      !data.driverId ||
      !data.id ||
      !data.vehicleNo ||
      !Object.values(vehicleType).includes(data.name!)
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: "Vehicle ID is required",
      });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.id } });
    if (!vehicle) {
      return res.status(404).json({
        isSuccess: false,
        message: "Vehicle not found",
      });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: data.id },
      data: {
        vehicleNo: data.vehicleNo,
        name: data.name,
        driverId: data.driverId,
      },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            isDriver: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- DELETE VEHICLE ----------------
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return res.status(404).json({
        isSuccess: false,
        message: "Vehicle not found",
      });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    res.status(200).json({
      isSuccess: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
