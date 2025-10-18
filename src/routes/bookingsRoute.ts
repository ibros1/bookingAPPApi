import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  getOneBooking,
} from "../controllers/bookingController";
import { authenticateUser } from "../../middleWare/authenticate";
import { authorize } from "../../middleWare/authorize";
const router = Router();

router.post("/create", createBooking);
router.get("/list", getAllBookings);

router.get(
  "/my-bookings",
  authenticateUser,
  authorize(["ADMIN", "BOOKER"]),
  getMyBookings
);

router.get("/:bookingId", getOneBooking);

export default router;
