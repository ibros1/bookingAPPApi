import { Request, Response } from "express";
import { iCreatedUser } from "../../types/user";
import { PrismaClient, Role } from "../generated/prisma";
import cloudinary from "../../config/cloudinary";
import argon2 from "argon2";
import { iCreatedDriver } from "../../types/driver";
const prisma = new PrismaClient();

export const registerDriver = async (req: Request, res: Response) => {
  try {
    const data: iCreatedDriver = req.body;

    if (
      !data.password ||
      !Object.values(Role).includes(data.role) ||
      data.isActive === undefined
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: "Validating error!",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "user is already registered" });
    }

    let result;
    console.log(req.file, result);
    if (req.file) {
      let encodedImage = `data:image/jpeg;base64,${req.file.buffer.toString(
        "base64"
      )}`;

      result = await cloudinary.uploader.upload(encodedImage, {
        resource_type: "image",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
        encoding: "base64",
      });
    }
    const hashedPassword = await argon2.hash(data.password);

    // Upload profile photo if file exists
    const active = data.isActive === "true" ? true : false;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        profilePhoto: result!.profilePhoto,
        isActive: active,
        isVerified: true,
      },
    });

    const { password, ...rest } = user;
    res.status(201).json({
      isSuccess: true,
      message: "User registered successfully",
      user: rest,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
