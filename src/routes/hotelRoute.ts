import { Router } from "express";
import {
  createHotel,
  listAllHotels,
  getOneHotel,
  updateHotel,
  deleteHotel,
  getHotelsByAddress,
} from "../controllers/hotelController";

const router = Router();

// Create a hotel
router.post("/create", createHotel);

router.get("/get_by_address", getHotelsByAddress);
// List all hotels (with optional pagination)
router.get("/list", listAllHotels);

// Get a single hotel by ID
router.get("/:hotelId", getOneHotel);

// Update a hotel
router.put("/update", updateHotel);

// Delete a hotel by ID
router.delete("/:hotelId", deleteHotel);

export default router;
