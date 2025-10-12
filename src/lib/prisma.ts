import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export async function logActivity(
  userId: string,
  action: string,
  details?: any
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: action.toUpperCase(),
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
