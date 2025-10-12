import { Router } from "express";
import {
  getMessagesForEmployee,
  markMessageAsSent,
  deleteMessage,
  listAllMessages,
  createMessage,
  getOneMessage,
} from "../controllers/messageController";

const router = Router();

// Create message and assign to multiple employees
router.post("/create", createMessage);

// Get all messages for a specific employee
router.get("/employee/:employeeId", getMessagesForEmployee);

router.get("/get_by_id/:messageId", getOneMessage);
// Mark a message as sent
router.patch("/sent/:messageRecipientId", markMessageAsSent);

// Get all messages for a specific employee
router.get("/list", listAllMessages);

// Delete a message and its recipients
router.delete("/:messageId", deleteMessage);

export default router;
