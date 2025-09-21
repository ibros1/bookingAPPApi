import { Request, Response, Router } from "express";
import {
  registerUser,
  loginUser,
  updateUser,
  updateRole,
  getAllUsers,
  getOneUser,
  updateProfile,
  toggleUserActive,
  googleAuth,
  googleCallback,
  logout,
  refreshToken,
  getMe,
} from "../controllers/userController";

import passport, { authenticate } from "passport";
import { authorize } from "../../middleWare/authorize";
import { authenticateUser } from "../../middleWare/authenticate";
import upload from "../../middleWare/cloudinaryMiddleware";
import multer from "multer";

const router = Router();
const uploade = multer();
router.get("/health", (_: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

router.post("/create", uploade.single("profilePhoto"), registerUser);
router.post("/login", loginUser);
router.put("/update", authenticateUser, authorize(["ADMIN"]), updateUser);
router.put("/role", updateRole);
router.get("/all", getAllUsers);
router.get(
  "/getOne/:userId",
  authenticateUser,
  authorize(["ADMIN"]),
  getOneUser
);
router.put(
  "/profile-update",
  authenticateUser,
  upload.single("image"),
  updateProfile
);
router.put(
  "/toggle-active",
  authenticateUser,
  authorize(["ADMIN"]),
  toggleUserActive
);

// Google auth routes
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);
router.post("/auth/logout", authenticateUser, logout);

router.get("/me", authenticateUser, getMe);
router.post("/refresh-token", refreshToken);
export default router;
