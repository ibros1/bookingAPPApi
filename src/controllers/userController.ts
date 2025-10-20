import { PrismaClient, Role, User } from "../generated/prisma";
import { Request, Response } from "express";
import argon2 from "argon2";
import {
  iCreatedUser,
  iLoginUser,
  iUpdatedRole,
  iUpdatedUser,
} from "../../types/user";
import { generateToken } from "../../helpers/jwt"; // Only access token
import { authRequest } from "../../types/request";
import { logActivity } from "../../middleWare/prismaLogger";

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, confirmPassword, address } = req.body;

    if (!name || !phone || !password || !confirmPassword)
      return res
        .status(400)
        .json({ isSuccess: false, message: "All fields are required!" });

    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ isSuccess: false, message: "Passwords do not match" });

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser)
      return res
        .status(400)
        .json({ isSuccess: false, message: "User already exists" });

    const hashedPassword = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        address,
      },
    });

    // Log user registration activity
    await logActivity(newUser.id, "USER_REGISTERED", "USER", newUser.id, {
      message: `User ${name} registered successfully`,
      userPhone: phone,
      userEmail: email,
    });

    return res.json({
      isSuccess: true,
      message: "User registered successfully!.",
      newUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- LOGIN USER ---------------- */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const data: iLoginUser = req.body;

    if (!data.phone || !data.password) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Validation error" });
    }

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "Phone not found" });
    }

    const isPasswordCorrect = await argon2.verify(user.password, data.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "Incorrect password" });
    }

    // Generate only an access token (no refresh token)
    const token = generateToken(user.id);

    const { password, ...rest } = user;
    res.status(200).json({
      isSuccess: true,
      message: "Login successful",
      user: rest,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- UPDATE ROLE ---------------- */
export const updateRole = async (req: authRequest, res: Response) => {
  try {
    const data: iUpdatedRole = req.body;

    if (!data.phone && !data.role) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Phone is required" });
    }
    const user = await prisma.user.update({
      where: { phone: data.phone },
      data: { role: data.role },
    });

    // Log role update activity
    await logActivity(user.id, "USER_ROLE_UPDATED", "USER", user.id, {
      message: `User role updated from ${user.role} to ${data.role}`,
      userPhone: data.phone,
      newRole: data.role,
      updatedBy: req.userId || "system",
    });

    res.status(200).json({
      isSuccess: true,
      message: "Role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- GET ALL USERS ---------------- */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(_req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(_req.query.perPage as string) || 10);

    // Fetch users excluding password
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          address: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // any other fields except password

          bookings: true,
        },
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      isSuccess: true,
      message: "Users fetched successfully",
      users,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
export const getAllOfficers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage as string) || 10);

    const [officers, total]: [User[], number] = await Promise.all([
      prisma.user.findMany({
        where: { role: "OFFICER" },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.count({ where: { role: "OFFICER" } }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    // reset the password
    const sanitizedUsers = officers.map(
      ({ password, refreshToken, ...rest }) => rest
    );

    res.status(200).json({
      isSuccess: true,
      message: "Officers fetched successfully",
      officers: sanitizedUsers,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error("Get All Officers Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
export const getAllBookers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage as string) || 10);

    const [bookers, total]: [User[], number] = await Promise.all([
      prisma.user.findMany({
        where: { role: "BOOKER" },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.count({ where: { role: "BOOKER" } }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    // reset the password
    const sanitizedUsers = bookers.map(
      ({ password, refreshToken, ...rest }) => rest
    );

    res.status(200).json({
      isSuccess: true,
      message: "Bookers fetched successfully",
      bookers: sanitizedUsers,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error("Get All bookers Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- DELETE USER ---------------- */
export const deleteUser = async (req: authRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    // Log user deletion activity before deleting
    await logActivity(
      existingUser.id,
      "USER_DELETED",
      "USER",
      existingUser.id,
      {
        message: `User ${existingUser.name} deleted from system`,
        deletedUser: {
          name: existingUser.name,
          phone: existingUser.phone,
          email: existingUser.email,
          role: existingUser.role,
        },
        deletedBy: req.userId || "system",
      }
    );

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      isSuccess: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- UPDATE USER ---------------- */
export const updateUser = async (req: authRequest, res: Response) => {
  try {
    const { userId, name, email, phone, address, isActive } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    // Check if phone is being updated and if it's already taken
    if (phone && phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
      });
      if (phoneExists) {
        return res
          .status(400)
          .json({ isSuccess: false, message: "Phone number already exists" });
      }
    }

    // Check if email is being updated and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ isSuccess: false, message: "Email already exists" });
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log user update activity
    await logActivity(updatedUser.id, "USER_UPDATED", "USER", updatedUser.id, {
      message: `User ${updatedUser.name} profile updated`,
      updatedFields: { name, email, phone, address, isActive },
      updatedBy: req.userId || "system",
    });

    res.status(200).json({
      isSuccess: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- GET ONE USER ---------------- */
export const getOneUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: true,
        adress: true,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    const { password, refreshToken, ...rest } = user;
    res.status(200).json({ isSuccess: true, user: rest });
  } catch (error) {
    console.error("Get One User Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

export const toggleUserActive = async (req: Request, res: Response) => {
  try {
    const { userId, isActive } = req.body;

    if (!userId || isActive === undefined) {
      return res.status(400).json({
        isSuccess: false,
        message: "userId and isActive are required",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    res.status(200).json({
      isSuccess: true,
      message: `User has been ${isActive ? "activated" : "deactivated"}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle User Active Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

/* ---------------- GET LOGGED IN USER ---------------- */
export const getMe = async (req: authRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found!" });
    }

    const { password, refreshToken, ...rest } = user;
    res.json({ isSuccess: true, user: rest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
