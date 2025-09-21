import { Request, Response } from "express";
import {
  currency,
  PaymentStatus,
  paymentType,
  PrismaClient,
} from "../generated/prisma";
import { iCreatedBooking, iUpdatedBooking } from "../../types/booking";

const prisma = new PrismaClient();

// CREATE BOOKING
export const createBooking = async (req: Request, res: Response) => {
  try {
    const data: iCreatedBooking = req.body;

    if (
      !data.userId ||
      !data.scheduleRideId ||
      !data.seatIds ||
      !Array.isArray(data.seatIds) ||
      data.seatIds.length === 0 ||
      !Object.values(currency).includes(data.currency) ||
      !Object.values(PaymentStatus).includes(data.paymentStatus) ||
      !Object.values(paymentType).includes(data.paymentType) ||
      !data.amount ||
      !data.name ||
      !data.phoneNumber
    ) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Missing or invalid fields" });
    }

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user)
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });

    const ride = await prisma.scheduleRide.findUnique({
      where: { id: data.scheduleRideId },
      include: { seats: true },
    });
    if (!ride)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Ride not found" });

    const seatsToBook = ride.seats.filter((seat) =>
      data.seatIds.includes(seat.id)
    );
    if (seatsToBook.length !== data.seatIds.length)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Some seats do not exist" });

    const alreadyBooked = seatsToBook.filter((seat) => seat.isBooked);
    if (alreadyBooked.length > 0)
      return res.status(400).json({
        isSuccess: false,
        message: "Some seats are already booked",
        seats: alreadyBooked.map((s) => s.seatNumber),
      });

    const totalAmount = data.amount * data.seatIds.length;

    const booking = await prisma.$transaction(async (tx) => {
      await tx.seats.updateMany({
        where: { id: { in: data.seatIds }, isBooked: false },
        data: { isBooked: true },
      });

      const newBooking = await tx.booking.create({
        data: {
          userId: data.userId,
          scheduleRideId: data.scheduleRideId,
          seatsIds: data.seatIds, // store all seat IDs here
          name: data.name,
          phoneNumber: data.phoneNumber,
          amount: data.amount,
          qty: data.seatIds.length,
          total_amount: totalAmount,
          currency: data.currency,
          paymentStatus: data.paymentStatus,
          paymentType: data.paymentType,
        },
      });

      await tx.bookingSeat.createMany({
        data: data.seatIds.map((seatId) => ({
          bookingId: newBooking.id,
          seatId,
        })),
      });

      return newBooking;
    });

    res.status(201).json({
      isSuccess: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error: any) {
    console.error("Create Booking Error:", error);
    res
      .status(500)
      .json({ isSuccess: false, message: error.message || "Server error" });
  }
};
// GET ALL BOOKINGS
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    //  read query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count(), // total bookings
      prisma.booking.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profilePhoto: true,
            },
          },
          scheduleRide: {
            select: {
              id: true,
              routeId: true,
              userId: true,
              vehicleId: true,
              driverId: true,
              fareUSD: true,
              fareSLSH: true,
              totalSeats: true,
              takenSeats: true,
              startTime: true,
              endTime: true,
              day: true,
              createdAt: true,
              updatedAt: true,
              route: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.status(200).json({
      isSuccess: true,
      total,
      page,
      limit,
      bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
// GET BOOKING BY RIDE_ID
export const getBookingsByRideId = async (req: Request, res: Response) => {
  try {
    const rideId = req.query.ride_id as string;

    if (!rideId) {
      return res.status(400).json({
        isSuccess: false,
        message: "ride_id query parameter is required",
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { scheduleRideId: rideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },

        scheduleRide: true,
      },
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        isSuccess: false,
        message: "No bookings found for this ride",
      });
    }

    res.status(200).json({ isSuccess: true, bookings });
  } catch (error) {
    console.error("Get Bookings By RideId Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// UPDATE BOOKING
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedBooking = req.body;
    if (!data.id)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Booking ID is required" });

    const booking = await prisma.booking.findUnique({ where: { id: data.id } });
    if (!booking)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Booking not found" });

    const updatedBooking = await prisma.booking.update({
      where: { id: data.id },
      data,
    });
    res.status(200).json({
      isSuccess: true,
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// DELETE BOOKING
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Booking not found" });

    await prisma.booking.delete({ where: { id: bookingId } });
    res
      .status(200)
      .json({ isSuccess: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
