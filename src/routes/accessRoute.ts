import { Router } from "express";
import { getAllDrivers } from "../controllers/AccessController";

const router = Router();

router.get(`/drivers`, getAllDrivers);

export default router;
