import express from "express";
import {
  createRoute,
  getAllRoutes,
  getOneRoute,
  updateRoute,
  deleteRoute,
} from "../controllers/routesController";

const router = express.Router();

// POST: Create a route
router.post("/", createRoute);

// GET: Get all routes (with pagination ?page=1&limit=10)
router.get("/", getAllRoutes);

// GET: Get a single route by ID
router.get("/:routeId", getOneRoute);

// PUT: Update a route
router.put("/", updateRoute);

// DELETE: Delete a route by ID
router.delete("/:routeId", deleteRoute);

export default router;
