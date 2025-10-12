import { Request, Response } from "express";
import admin from "../../helpers/fireBaseAdmin";
import { PrismaClient } from "../generated/prisma";
const Prisma = new PrismaClient();

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone)
    return res
      .status(400)
      .json({ isSuccess: false, message: "Phone required" });

  try {
    const session = await admin
      .auth()
      .createSessionCookie(phone, { expiresIn: 5 * 60 * 1000 }); // 5 min
    res.json({
      isSuccess: true,
      message: "OTP sent via Firebase",
      session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ isSuccess: false, message: "Firebase error" });
  }
};
export const verifyOtp = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken)
    return res
      .status(400)
      .json({ isSuccess: false, message: "Token required" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Phone not found" });
    }

    res.json({
      isSuccess: true,
      message: "Phone verified successfully",
      phone,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ isSuccess: false, message: "Invalid token" });
  }
};
