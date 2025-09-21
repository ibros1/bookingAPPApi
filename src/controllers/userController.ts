import { PrismaClient, Role } from "../generated/prisma/client";
import { NextFunction, Request, Response } from "express";
import argon2 from "argon2";
import {
  iCreatedUser,
  iLoginUser,
  iUpdatedRole,
  iUpdatedUser,
} from "../../types/user";
import { generateRefreshToken, generateToken } from "../../helpers/jwt";
import cloudinary from "../../config/cloudinary"; // Cloudinary config
import passport from "passport";
import { BASE_CLIENT_URL } from "../../constants/base_client_url";
import { verifyGoogleToken } from "../../config/passport";
import jwt from "jsonwebtoken";
import { authRequest } from "../../types/request";
const prisma = new PrismaClient();

// ---------------- REGISTER USER ----------------
export const registerUser = async (req: Request, res: Response) => {
  try {
    const data: iCreatedUser = req.body;

    if (
      !data.password ||
      !data.confirmPassword ||
      data.isActive === undefined
    ) {
      return res.status(400).json({
        isSuccess: false,
        message: "Validating error!",
      });
    }

    if (data.password !== data.confirmPassword) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Passwords do not match" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "user is already registered" });
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
        profilePhoto: data.profilePhoto ?? null,
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

// ---------------- LOGIN USER ----------------
// ---------------- LOGIN USER ----------------
export const loginUser = async (req: Request, res: Response) => {
  try {
    const data: iLoginUser = req.body;

    if (!data.email || !data.password) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Validating error" });
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user)
      return res
        .status(401)
        .json({ isSuccess: false, message: "Email not found" });

    if (user.googleId || !user.password) {
      return res.status(400).json({
        isSuccess: false,
        message:
          "This account uses Google authentication. Please sign in with Google.",
      });
    }

    const isPasswordCorrect = await argon2.verify(
      user.password!,
      data.password
    );
    if (!isPasswordCorrect)
      return res
        .status(401)
        .json({ isSuccess: false, message: "Incorrect password" });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Send cookies
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: "/", // restrict to refresh endpoint
    });

    const { password, ...rest } = user;
    res.status(200).json({
      isSuccess: true,
      message: "Login successfull",
      user: rest,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- UPDATE USER ----------------
export const updateUser = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedUser = req.body;
    if (!data.id) {
      return res.status(400).json({
        isSuccess: false,
        message: "validating error",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    let hashedPassword = user.password;
    if (data.password) {
      hashedPassword = await argon2.hash(data.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name ?? user.name,
        phone: data.phone ?? user.phone,
        email: data.email ?? user.email,
        isActive: user.isActive,
        password: hashedPassword,
      },
    });

    const { password, ...rest } = updatedUser;
    res
      .status(200)
      .json({ isSuccess: true, message: "User updated", user: rest });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- UPDATE ROLE ----------------
export const updateRole = async (req: Request, res: Response) => {
  try {
    const data: iUpdatedRole = req.body;

    const user = await prisma.user.update({
      where: { id: data.id },
      data: { role: data.role },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Role updated",
      user,
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- GET ALL USERS ----------------
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    const sanitized = users.map(({ password, refreshToken, ...rest }) => rest);

    res.status(200).json({
      isSuccess: true,
      message: "Users fetched",
      users: sanitized,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- GET ONE USER ----------------
export const getOneUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    const { password, ...rest } = user;
    res.status(200).json({ isSuccess: true, user: rest });
  } catch (error) {
    console.error("Get One User Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const updateFieldsImage = {
      id: req.body.id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      profilePhoto: req.body.profilePhoto,
    };

    if (!updateFieldsImage.id) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateFieldsImage.id },
    });
    if (!user) {
      return res
        .status(404)
        .json({ isSuccess: false, message: "User not found" });
    }

    let hashedPassword = user.password;
    if (updateFieldsImage.password) {
      hashedPassword = await argon2.hash(updateFieldsImage.password);
    }

    let result;
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

    const updatedUser = await prisma.user.update({
      where: { id: updateFieldsImage.id },
      data: {
        name: updateFieldsImage.name ?? user.name,
        email: updateFieldsImage.email ?? user.email,
        phone: updateFieldsImage.phone ?? user.phone,
        password: hashedPassword,
        profilePhoto: result?.url,
      },
    });

    const { password: _, ...rest } = updatedUser;

    res.status(200).json({
      isSuccess: true,
      message: "Profile updated successfully",
      user: rest,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
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

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User not found",
      });
    }

    // Update isActive status
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
        email: updatedUser.email,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle User Active Error:", error);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};

export const googleAuth = (req: Request, res: Response, next: any) => {
  const redirectUrl = (req.query.redirect_uri as string) || BASE_CLIENT_URL;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirectUrl, // pass redirect back to frontend
  })(req, res, next);
};

// Google OAuth callback
export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      console.error("Google auth error:", err);
      return res.redirect(
        `${BASE_CLIENT_URL}/login?error=AuthenticationFailed`
      );
    }

    try {
      // Generate access & refresh tokens
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token in DB
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Set cookies
      res.cookie("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 15, // 15 min
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Redirect to frontend with only a success flag
      const redirectUrl = (req.query.state as string) || BASE_CLIENT_URL;

      const token = accessToken;
      res.redirect(
        `${redirectUrl}?token=${encodeURIComponent(
          token
        )}&refresh_token=${encodeURIComponent(
          refreshToken
        )}&user=${encodeURIComponent(
          JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhoto: user.profilePhoto,
            isVerified: user.isVerified,
            isActive: user.isActive,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
          })
        )}`
      );
    } catch (error) {
      console.error("Token generation error:", error);
      return res.redirect(`${BASE_CLIENT_URL}/login?error=ServerError`);
    }
  })(req, res, next);
};

export const logout = async (req: authRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (userId) {
      // Clear refresh token in DB
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    }

    // Clear cookies
    res.clearCookie("auth_token");
    res.clearCookie("refresh_token");

    res.status(200).json({ isSuccess: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token)
      return res
        .status(401)
        .json({ isSuccess: false, message: "No refresh token" });

    const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user || user.refreshToken !== token) {
      return res
        .status(403)
        .json({ isSuccess: false, message: "Invalid refresh token" });
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Save new refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Send updated cookies
    res.cookie("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 15,
    });

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/api/auth/refresh",
    });

    res.json({ isSuccess: true, token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res
      .status(401)
      .json({ isSuccess: false, message: "Invalid refresh token" });
  }
};
export const getMe = async (req: authRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User not found!",
      });
    }

    // Destructure only if user is not null
    const { password, refreshToken, ...rest } = user;
    res.json({ isSuccess: true, user: rest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isSuccess: false, message: "Server error" });
  }
};
