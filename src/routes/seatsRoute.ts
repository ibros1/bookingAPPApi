import { Router } from "express";
import {
  createSeat,
  getAllSeats,
  updateSeat,
  deleteSeat,
  getSeatsByRideId,
} from "../controllers/seatsController";

const router = Router();

router.post("/create", createSeat);
router.get("/", getAllSeats);
router.put("/update", updateSeat);
router.delete("/:seatId", deleteSeat);
router.get("/get-by-ride", getSeatsByRideId);
export default router;
