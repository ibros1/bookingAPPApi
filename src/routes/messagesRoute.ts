import { Router } from "express";
import {
  getMessagesForEmployee,
  markMessageAsSent,
  deleteMessage,
  listAllMessages,
  createMessage,
  getOneMessage,
} from "../controllers/messageController";
import { authenticateUser } from "../../middleWare/authenticate";
import { authorize } from "../../middleWare/authorize";
import {
  ensureWhatsAppStarted,
  getWhatsAppStatus,
  sendBulkWhatsApp,
  resetWhatsAppSession,
} from "../../messaging/whatsApp";

const router = Router();

// Create message and assign to multiple employees
router.post("/create", authenticateUser, authorize(["ADMIN"]), createMessage);

// Get all messages for a specific employee
router.get(
  "/employee/:employeeId",
  authenticateUser,
  authorize(["ADMIN"]),
  getMessagesForEmployee
);

router.get(
  "/get_by_id/:messageId",
  authenticateUser,
  authorize(["ADMIN"]),
  getOneMessage
);
// Mark a message as sent
router.patch(
  "/sent/:messageRecipientId",
  authenticateUser,
  authorize(["ADMIN"]),
  markMessageAsSent
);

// Get all messages for a specific employee
router.get("/list", authenticateUser, authorize(["ADMIN"]), listAllMessages);

// Delete a message and its recipients
router.delete(
  "/:messageId",
  authenticateUser,
  authorize(["ADMIN"]),
  deleteMessage
);

// WhatsApp admin-only endpoints
router.post(
  "/whatsapp/connect",
  authenticateUser,
  authorize(["ADMIN"]),
  async (req, res) => {
    await ensureWhatsAppStarted();
    const status = await getWhatsAppStatus();
    res.json({ isSuccess: true, ...status });
  }
);

router.get(
  "/whatsapp/status",
  authenticateUser,
  authorize(["ADMIN"]),
  async (req, res) => {
    const status = await getWhatsAppStatus();
    res.json({ isSuccess: true, ...status });
  }
);

router.post(
  "/whatsapp/send",
  authenticateUser,
  authorize(["ADMIN"]),
  async (req, res) => {
    const { numbers, message } = req.body as {
      numbers: string[];
      message: string;
    };
    if (!Array.isArray(numbers) || !message) {
      res.status(400).json({ isSuccess: false, message: "Invalid payload" });
      return;
    }
    await ensureWhatsAppStarted();
    await sendBulkWhatsApp(numbers, message);
    res.json({ isSuccess: true });
  }
);

router.post(
  "/whatsapp/reset",
  authenticateUser,
  authorize(["ADMIN"]),
  async (req, res) => {
    await resetWhatsAppSession();
    const status = await getWhatsAppStatus();
    res.json({ isSuccess: true, ...status });
  }
);

export default router;
