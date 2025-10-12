import dotenv from "dotenv";
import express from "express";

import cors from "cors";

import userRoute from "./routes/useRoute";
import routeRoute from "./routes/routesRoute";
import addressRoute from "./routes/addresRoute";
import ridesRoute from "./routes/ridesRoute";
import bookingRoute from "./routes/bookingsRoute";
import hotelRoutes from "./routes/hotelRoute";
import employeeRoute from "./routes/employeeRoute";
import messageRoute from "./routes/messagesRoute";
import activityLogsRoute from "./routes/activityLogs";
import { initWhatsApp, sendBulkWhatsApp } from "../messaging/whatsApp";

dotenv.config();
const PORT = process.env.PORT;
const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// Middleware order is important!
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:7000"],
    credentials: true,
  })
);
let whatsappReady = false;

// Initialize WhatsApp
initWhatsApp().then(() => {
  whatsappReady = true;
});

app.post("/send-message", async (req, res) => {
  if (!whatsappReady) {
    return res.status(400).json({ message: "WhatsApp not ready yet" });
  }

  const { numbers, message } = req.body;

  try {
    await sendBulkWhatsApp(numbers, message);
    res.json({ message: "Messages sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send messages" });
  }
});
app.use("/api/users", userRoute);
app.use("/api/routes", routeRoute);
app.use("/api/address", addressRoute);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rides", ridesRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/messages", messageRoute);
app.use("/api/activity-logs", activityLogsRoute);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT} `);
});
