import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getBookingsByRideId,
} from "../controllers/booksController";

const router = Router();

router.post("/create", createBooking);
router.get("/", getAllBookings);
router.put("/update", updateBooking);
router.delete("/:bookingId", deleteBooking);
router.get("/get-by-ride", getBookingsByRideId);

export default router;
