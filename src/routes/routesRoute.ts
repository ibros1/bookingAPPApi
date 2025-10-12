import express from "express";
import {
  createRoute,
  getAllRoutes,
  getOneRoute,
  updateRoute,
  deleteRoute,
} from "../controllers/routesController";

const router = express.Router();

router.post("/create", createRoute);

router.get("/list", getAllRoutes);

router.get("/:routeId", getOneRoute);

router.put("/update", updateRoute);

router.delete("/delete/:routeId", deleteRoute);

export default router;
