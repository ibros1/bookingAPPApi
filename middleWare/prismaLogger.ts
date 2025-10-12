import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();

/**
 * Logs user activity
 * @param userId - ID of the user performing the action
 * @param action - e.g. "EMPLOYEE_CREATED"
 * @param targetType - e.g. "EMPLOYEE", "BOOKING"
 * @param targetId - affected record ID (optional)
 * @param details - any additional info (string | object | array)
 */
export const logActivity = async (
  userId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
) => {
  try {
    if (Array.isArray(details)) {
      // Handle multiple logs at once
      const data = details.map((d) => ({
        userId,
        action,
        targetType: d.targetType || targetType,
        targetId: d.targetId,
        details: d.details || d,
      }));
      await prisma.activityLog.createMany({ data });
    } else {
      // Single log
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          details,
        },
      });
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
