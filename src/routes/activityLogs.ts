import { Router } from "express";
import { getAllActivityLogs } from "../controllers/ActivityLogController";

const router = Router();

router.get("/list", getAllActivityLogs);

export default router;
