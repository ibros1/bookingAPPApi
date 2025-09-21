import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { iCreatedSeat, iUpdatedSeat } from "../../types/seat";

const prisma = new PrismaClient();

// CREATE SEAT
export const createSeat = async (req: Request, res: Response) => {
  try {
    const data: iCreatedSeat = req.body;
    if (!data.scheduleRideId || !data.seatNumber)
      return res
        .status(400)
        .json({ isSuccess: false, message: "All fields are required" });

    const seat = await prisma.seats.create({ data });
    res
      .status(201)
      .json({ isSuccess: true, message: "Seat created successfully", seat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// GET ALL SEATS
export const getAllSeats = async (req: Request, res: Response) => {
  try {
    const seats = await prisma.seats.findMany();
    if (!seats) {
      return res.status(404).json({
        isSuccess: false,
        message: " no seats found!",
      });
    }
    res.status(200).json({ isSuccess: true, seats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
export const getSeatsByRideId = async (req: Request, res: Response) => {
  try {
    const rideId = req.query.ride_id as string;

    if (!rideId) {
      return res.status(400).json({
        isSuccess: false,
        message: "ride_id query parameter is required",
      });
    }

    const seats = await prisma.seats.findMany({
      where: { scheduleRideId: rideId },
      orderBy: { seatNumber: "asc" }, // optional: order seats by number
    });

    if (!seats || seats.length === 0) {
      return res.status(404).json({
        isSuccess: false,
        message: "No seats found for this ride",
      });
    }

    res.status(200).json({ isSuccess: true, seats });
  } catch (error) {
    console.error("Get Seats By RideId Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// UPDATE SEAT
export const updateSeat = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedSeat = req.body;
    if (!data.id)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Seat ID is required" });

    const seat = await prisma.seats.findUnique({ where: { id: data.id } });
    if (!seat)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Seat not found" });

    const updatedSeat = await prisma.seats.update({
      where: { id: data.id },
      data,
    });
    res.status(200).json({
      isSuccess: true,
      message: "Seat updated successfully",
      seat: updatedSeat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// DELETE SEAT
export const deleteSeat = async (req: Request, res: Response) => {
  try {
    const { seatId } = req.params;

    const seat = await prisma.seats.findUnique({ where: { id: seatId } });
    if (!seat)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Seat not found" });

    await prisma.seats.delete({ where: { id: seatId } });
    res
      .status(200)
      .json({ isSuccess: true, message: "Seat deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
