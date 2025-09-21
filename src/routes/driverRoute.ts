import { Router } from "express";
import upload from "../../middleWare/cloudinaryMiddleware";
import { registerDriver } from "../controllers/driverController";

const router = Router();

router.post("/create-driver", upload.single("profilePhoto"), registerDriver);

export default router;
