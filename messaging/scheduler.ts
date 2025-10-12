import cron from "node-cron";
import { PrismaClient } from "../src/generated/prisma";
import { sendBulkWhatsApp } from "./whatsApp";

const prisma = new PrismaClient();

// Runs every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] Running scheduled message job...`);

    // Find all pending recipients with scheduledAt <= now
    const pendingRecipients = await prisma.messageRecipient.findMany({
      where: {
        sent: false,
        scheduledAt: { lte: now },
      },
      include: { message: true },
    });

    if (pendingRecipients.length === 0) {
      console.log("No scheduled messages to send at this time.");
      return;
    }

    for (const recipient of pendingRecipients) {
      try {
        await sendBulkWhatsApp([recipient.phone], recipient.message.message);
        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: { sent: true },
        });
        console.log(`✅ Scheduled message sent to ${recipient.phone}`);
      } catch (err) {
        console.error(`❌ Failed to send message to ${recipient.phone}:`, err);
      }
    }
  } catch (error) {
    console.error("Error running scheduled message job:", error);
  }
});
