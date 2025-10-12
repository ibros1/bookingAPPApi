import { Router } from "express";
import {
  createBooking,
  getAllBookings,
} from "../controllers/bookingController";
const router = Router();

router.post("/create", createBooking);
router.get("/list", getAllBookings);

export default router;
