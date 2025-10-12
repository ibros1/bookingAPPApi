import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { sendBulkWhatsApp } from "../../messaging/whatsApp";

const prisma = new PrismaClient();

// CREATE MESSAGE
export const createMessage = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      message,
      employeeIds = [],
      extraNumbers = [],
      scheduledAt,
    } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "Message, userId and at least one recipient required.",
      });
    }

    // fetch employee phones
    const employees =
      employeeIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, phone: true },
          })
        : [];

    // create the main message
    const newMessage = await prisma.message.create({
      data: { message, userId },
    });

    // recipients for employees
    const recipients = employees.map((emp) => ({
      userId,
      employeeId: emp.id,
      phone: emp.phone,
      messageId: newMessage.id,
      sent: scheduledAt ? false : true,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    }));

    // save employee/user recipients
    if (recipients.length > 0) {
      await prisma.messageRecipient.createMany({
        data: recipients,
        skipDuplicates: true,
      });
    }

    // save extra numbers separately (with name support)
    if (extraNumbers.length > 0) {
      await prisma.extraNumber.createMany({
        data: extraNumbers.map((num: { phone: string; name?: string }) => ({
          phone: num.phone,
          name: num.name || null,
          messageId: newMessage.id,
        })),
        skipDuplicates: true,
      });
    }

    // if NOT scheduled, send immediately
    if (!scheduledAt) {
      const phones = [
        ...recipients.map((r) => r.phone),
        ...extraNumbers.map((n: { phone: string }) => n.phone),
      ];

      if (phones.length > 0) {
        await sendBulkWhatsApp(phones, message);
        console.log(`Immediate message sent to: ${phones.join(", ")}`);
      }
    }

    res.status(201).json({
      message: "Message created successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all messages for a specific employee
export const getMessagesForEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const messages = await prisma.messageRecipient.findMany({
      where: { employeeId },
      include: {
        message: {
          include: { extraNumbers: true },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getOneMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        extraNumbers: true,
        recipients: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            phone: true,
          },
        },
        _count: true,
      },
    });
    if (!messageId) {
      res.status(404).json({ message: "Message not found" });
      return;
    }
    res.status(200).json({
      isSuccess: true,
      message: "successfully found Message details",
      data: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark a message as sent
export const markMessageAsSent = async (req: Request, res: Response) => {
  try {
    const { messageRecipientId } = req.params;

    const updated = await prisma.messageRecipient.update({
      where: { id: messageRecipientId },
      data: { sent: true },
    });

    res.json({ message: "Message marked as sent", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a message (and its recipients + extra numbers)
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    await prisma.messageRecipient.deleteMany({ where: { messageId } });
    await prisma.extraNumber.deleteMany({ where: { messageId } });
    await prisma.message.delete({ where: { id: messageId } });

    res.json({ message: "Message and related recipients deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// List all messages with pagination
export const listAllMessages = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true },
          },
          recipients: true,
          extraNumbers: true,
        },
      }),
      prisma.message.count(),
    ]);

    if (!messages) {
      return res.status(404).json({ message: "No messages found" });
    }

    res.json({
      data: messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
