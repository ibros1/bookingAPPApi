import express from "express";
import {
  createRide,
  getAllRides,
  getOneRide,
  updateRide,
  deleteRide,
} from "../controllers/ridesController";

const router = express.Router();

router.post("/create", createRide);

router.get("/list", getAllRides);

router.get("/:rideId", getOneRide);

router.put("/update", updateRide);

router.delete("/delete/:rideId", deleteRide);

export default router;
