import { Request, Response, Router } from "express";
import {
  registerUser,
  loginUser,
  updateUser,
  updateRole,
  getAllUsers,
  getOneUser,
  toggleUserActive,
  getMe,
  getAllOfficers,
  getAllBookers,
} from "../controllers/userController";

import { authorize } from "../../middleWare/authorize";
import { authenticateUser } from "../../middleWare/authenticate";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/health", (_: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

router.post("/create", upload.single("profilePhoto"), registerUser);
router.post("/login", loginUser);
router.put("/update", authenticateUser, authorize(["ADMIN"]), updateUser);
router.put("/update-role", updateRole);
router.get("/all", getAllUsers);
router.get(
  "/get-one/:userId",
  authenticateUser,
  authorize(["ADMIN"]),
  getOneUser
);
router.put(
  "/toggle-active",
  authenticateUser,
  authorize(["ADMIN"]),
  toggleUserActive
);
router.get("/me", authenticateUser, getMe);
router.get(
  "/get_officers",
  authenticateUser,
  authorize(["ADMIN"]),
  getAllOfficers
);
router.get(
  "/get_bookers",
  authenticateUser,
  authorize(["ADMIN"]),
  getAllBookers
);

export default router;
