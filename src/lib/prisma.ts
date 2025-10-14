import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"], // optional
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

prisma.$use(async (params: any, next: any) => {
  const result = await next(params);

  if (["create", "update", "delete"].includes(params.action)) {
    console.log(`[DB LOG] ${params.model} ${params.action}`, {
      data: params.args?.data,
      where: params.args?.where,
    });

    const userId = params.args?.data?.userId || params.args?.where?.userId;

    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: `${params.model}_${params.action}`.toUpperCase(),
          details: JSON.stringify(params.args),
        },
      });
    }
  }

  return result;
});

export default prisma;
