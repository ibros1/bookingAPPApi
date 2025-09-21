import { Request, Response } from "express";
import { Days, PrismaClient } from "../generated/prisma";
import {
  iCreatedScheduleRide,
  iUpdatedScheduleRide,
} from "../../types/schedulrRide";

const prisma = new PrismaClient();

// CREATE SCHEDULE RIDE
export const createScheduleRide = async (req: Request, res: Response) => {
  try {
    const data: iCreatedScheduleRide = req.body;

    // Validate required fields
    if (
      !data.routeId ||
      !data.vehicleId ||
      !data.driverId ||
      !data.fareSLSH ||
      !data.fareUSD ||
      !Object.values(Days).includes(data.day) ||
      !data.startTime ||
      !data.endTime
    ) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Missing fields" });
    }

    // Validate driver
    const driver = await prisma.user.findUnique({
      where: { id: data.driverId },
    });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // Validate vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Validate route
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
    });
    if (!route) return res.status(404).json({ message: "Route not found" });

    // Create scheduleRide
    const ride = await prisma.scheduleRide.create({
      data: {
        ...data,
        totalSeats: vehicle.capacity,
        takenSeats: [],
      },
    });

    // Create seats automatically for this ride
    const seatData = Array.from({ length: vehicle.capacity }).map((_, i) => ({
      scheduleRideId: ride.id,
      vehicleId: vehicle.id,
      seatNumber: i + 1,
    }));

    await prisma.seats.createMany({ data: seatData });

    res.status(201).json({
      isSuccess: true,
      message: "Schedule ride created with seats",
      ride,
    });
  } catch (error) {
    console.error("Create Schedule Ride Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// GET ALL SCHEDULE RIDES
export const getAllScheduleRides = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.limit as string) || 10;

    const rides = await prisma.scheduleRide.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        route: true,
      },
    });

    const total = await prisma.scheduleRide.count();

    res.status(200).json({
      isSuccess: true,
      message: "successfully fetched",
      rides,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
// GET SCHEDULE RIDES BY ROUTE_ID (with pagination and optional day filter)

export const getSchedulesByRoute = async (req: Request, res: Response) => {
  try {
    const routeQuery = req.query.route_id as string;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;

    const date = req.query.date as string | undefined; // <-- NEW

    if (!routeQuery) {
      return res.status(400).json({
        isSuccess: false,
        message: "route_id query parameter is required",
      });
    }

    const routeIds = routeQuery.split(",").map((id) => id.trim());

    const whereClause: any = { routeId: { in: routeIds } };

    // 🔹 If date is provided, filter startTime by that date
    if (date) {
      // expected format: dd/mm/yyyy
      const [dayPart, monthPart, yearPart] = date.split("/");
      const parsedDate = new Date(
        Number(yearPart),
        Number(monthPart) - 1,
        Number(dayPart)
      );

      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    console.log("WHERE CLAUSE:", whereClause);

    const rides = await prisma.scheduleRide.findMany({
      where: whereClause,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        route: true,
        bookings: true,
        seats: true,
      },
      orderBy: { startTime: "asc" },
    });

    if (!rides.length) {
      return res.status(404).json({
        isSuccess: false,
        message: "No schedule rides found for this route, day, or date",
      });
    }

    const total = await prisma.scheduleRide.count({ where: whereClause });

    res.status(200).json({
      isSuccess: true,
      rides,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Get Schedules By Route Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// // GET ONE SCHEDULE RIDE
export const getOneScheduleRide = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.scheduleRide.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        driver: true,
        route: true,
        bookings: true,
        seats: true,
      },
    });

    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Schedule ride not found" });

    res.status(200).json({ isSuccess: true, ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// UPDATE SCHEDULE RIDE
export const updateScheduleRide = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedScheduleRide = req.body;

    if (
      !data.id ||
      !data.fareSLSH ||
      !data.fareUSD ||
      !data.day ||
      !data.startTime ||
      !data.endTime ||
      !data.totalSeats
    )
      return res
        .status(400)
        .json({ isSuccess: false, message: "Validation required" });

    const ride = await prisma.scheduleRide.findUnique({
      where: { id: data.id },
    });
    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Schedule ride not found" });

    const updatedRide = await prisma.scheduleRide.update({
      where: { id: data.id },
      data,
    });
    res.status(200).json({
      isSuccess: true,
      message: "Schedule ride updated successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// DELETE SCHEDULE RIDE
export const deleteScheduleRide = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.scheduleRide.findUnique({
      where: { id: rideId },
    });
    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Schedule ride not found" });

    await prisma.scheduleRide.delete({ where: { id: rideId } });
    res
      .status(200)
      .json({ isSuccess: true, message: "Schedule ride deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
