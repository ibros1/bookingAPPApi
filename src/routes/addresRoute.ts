import express from "express";
import {
  createAddress,
  deleteAddress,
  getOneAddress,
  listAllAddress,
  updateAddress,
} from "../controllers/addressController";

const router = express.Router();

router.post("/create", createAddress);

router.get("/list", listAllAddress);

router.get("/:addressId", getOneAddress);

router.put("/update", updateAddress);

router.delete("/delete/:addressId", deleteAddress);

export default router;
