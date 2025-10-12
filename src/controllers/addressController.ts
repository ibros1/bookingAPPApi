import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import {
  iCreatedAddressPayload,
  iUpdatedAddressPayload,
} from "../../types/address";
const prisma = new PrismaClient();

export const createAddress = async (req: Request, res: Response) => {
  try {
    const data: iCreatedAddressPayload = req.body;
    if (!data.address || !data.officerId || !data.userId) {
      res.status(400).json({
        isSuccess: false,
        message: "Address validation is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });
    if (!user) {
      res.status(404).json({
        isSuccess: false,
        message: "User not found",
      });
    }

    const address = await prisma.address.create({
      data,
    });
    res.status(201).json({
      isSuccess: true,
      message: "Address created successfully",
      address,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// listAllAddress

export const listAllAddress = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.limit as string) || 10);
    const [address, total] = await Promise.all([
      prisma.address.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          officers: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              phone: true,
            },
          },
        }, // include user details
        orderBy: { updatedAt: "desc" },
      }),
      prisma.route.count(),
    ]);

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      isSuccess: true,
      address,
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

// getOneAddress

export const getOneAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: addressId },
      include: {
        officers: {
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
    if (!address) {
      res.status(404).json({
        isSuccess: false,
        message: "no address found yet!",
      });
      return;
    }
    res.status(200).json({
      isSuccess: true,
      address,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// updateAddress

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedAddressPayload = req.body;
    if (!data.address || !data.officerId || !data.id) {
      res.status(400).json({
        isSuccess: false,
        message: "Address validation is required",
      });
      return;
    }

    const user = await prisma.address.findUnique({
      where: {
        id: data.id,
      },
    });
    if (!user) {
      res.status(404).json({
        isSuccess: false,
        message: "address not found",
      });
      return;
    }

    const address = await prisma.address.update({
      where: {
        id: data.id,
      },
      data,
    });
    res.status(200).json({
      isSuccess: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
    });
  }
};

// delete address

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address)
      return res
        .status(404)
        .json({ isSuccess: false, message: "Address not found" });

    const deletedAddress = await prisma.address.delete({
      where: { id: addressId },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Address deleted successfully",
      deletedAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
