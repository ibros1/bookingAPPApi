import { Router } from "express";
import {
  createVehicle,
  getAllVehicles,
  getOneVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController";

const router = Router();

// Create a new vehicle
router.post("/create", createVehicle);

// Get all vehicles
router.get("/", getAllVehicles);

// Get a single vehicle by ID
router.get("/:vehicleId", getOneVehicle);

// Update a vehicle
router.put("/update", updateVehicle);

// Delete a vehicle by ID
router.delete("/:vehicleId", deleteVehicle);

export default router;
