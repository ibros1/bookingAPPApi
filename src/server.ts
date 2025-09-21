import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import cors from "cors";
import session from "express-session";
import passport from "../config/passport";

import userRoute from "./routes/useRoute";
import driverRoute from "./routes/driverRoute";
import vehicleRoute from "./routes/vehicleRoute";
import accessRoute from "./routes/accessRoute";
import routeRoute from "./routes/routesRoute";
import scheduleRoute from "./routes/schedulrRideRoutes";
import seatRoute from "./routes/seatsRoute";
import bookingRoute from "./routes/bookingsRoute";
dotenv.config();
const PORT = process.env.PORT;
const app = express();

// Middleware order is important!
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:7000"],
    credentials: true,
  })
);
app.use(express.json()); // This should come before routes
app.use(cookieParser());
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Routes should be registered after body parsing middleware
app.use("/api/users", userRoute);
app.use("/api/drivers", driverRoute);
app.use("/api/vehicles", vehicleRoute);
app.use("/api/roles", accessRoute);
app.use("/api/routes", routeRoute);
app.use("/api/schedules", scheduleRoute);
app.use("/api/seats", seatRoute);
app.use("/api/bookings", bookingRoute);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT} `);
});
