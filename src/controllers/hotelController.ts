import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { iCreatedHotel, iUpdatedHotel } from "../../types/hotels";
import { logActivity } from "../../middleWare/prismaLogger";
import { authRequest } from "../../types/request";

const prisma = new PrismaClient();

// Create Hotel
export const createHotel = async (req: authRequest, res: Response) => {
  try {
    const data: iCreatedHotel = req.body;
    if (!data.name || !data.addressId) {
      return res.status(400).json({
        isSuccess: false,
        message: "Hotel name and addressId are required",
      });
    }

    // Check if address exists
    const address = await prisma.address.findUnique({
      where: { id: data.addressId },
    });
    if (!address) {
      return res.status(404).json({
        isSuccess: false,
        message: "Address not found",
      });
    }

    const hotel = await prisma.hotel.create({
      data,
    });

    // Log hotel creation activity
    await logActivity(
      (req as authRequest).userId || "system",
      "HOTEL_CREATED",
      "HOTEL",
      hotel.id,
      {
        message: `Hotel ${hotel.name} created successfully`,
        hotelDetails: {
          name: hotel.name,
          addressId: hotel.addressId,
        },
      }
    );

    res.status(201).json({
      isSuccess: true,
      message: "Hotel created successfully",
      hotel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// List all hotels
export const listAllHotels = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.limit as string) || 10);

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          address: true, // include address details
          booker: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              phone: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.hotel.count(),
    ]);

    if (!hotels.length) {
      return res.status(404).json({
        isSuccess: false,
        message: "Hotels not found",
      });
    }

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      isSuccess: true,
      hotels,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// Get one hotel
export const getOneHotel = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        address: true,
        booker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            phone: true,
          },
        },
      },
    });

    if (!hotel) {
      return res.status(404).json({
        isSuccess: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      isSuccess: true,
      hotel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};
// get hotels by address
export const getHotelsByAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.limit as string) || 10);

    if (!addressId) {
      return res.status(400).json({
        isSuccess: false,
        message: "addressId query parameter is required",
      });
    }

    // Check if the address exists
    const address = await prisma.address.findUnique({
      where: { id: addressId as string },
    });

    if (!address) {
      return res.status(404).json({
        isSuccess: false,
        message: "Address not found",
      });
    }

    // Fetch hotels for the address with pagination
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where: { addressId: addressId as string },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          booker: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              phone: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.hotel.count({
        where: { addressId: addressId as string },
      }),
    ]);

    if (!hotels.length) {
      return res.status(404).json({
        isSuccess: false,
        message: "No hotels found for this address",
      });
    }

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      isSuccess: true,
      address,
      hotels,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};
// Update hotel
export const updateHotel = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedHotel = req.body;
    if (!data.id || !data.name || !data.addressId) {
      return res.status(400).json({
        isSuccess: false,
        message: "Hotel id, name, and addressId are required",
      });
    }

    const hotelExists = await prisma.hotel.findUnique({
      where: { id: data.id },
    });
    if (!hotelExists) {
      return res.status(404).json({
        isSuccess: false,
        message: "Hotel not found",
      });
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: data.id },
      data,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Hotel updated successfully",
      hotel: updatedHotel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// Delete hotel
export const deleteHotel = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });
    if (!hotel) {
      return res.status(404).json({
        isSuccess: false,
        message: "Hotel not found",
      });
    }

    const deletedHotel = await prisma.hotel.delete({
      where: { id: hotelId },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Hotel deleted successfully",
      deletedHotel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};
