import { Router } from "express";
import {
  createScheduleRide,
  deleteScheduleRide,
  getAllScheduleRides,
  getOneScheduleRide,
  getSchedulesByRoute,
  updateScheduleRide,
} from "../controllers/scheduleRide";

const router = Router();

router.post("/create", createScheduleRide);
router.get("/", getAllScheduleRides);
router.get("/routes/get-one-by-route", getSchedulesByRoute);
router.get("/:rideId", getOneScheduleRide);
router.put("/update", updateScheduleRide);
router.delete("/:rideId", deleteScheduleRide);
export default router;
