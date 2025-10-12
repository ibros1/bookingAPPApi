-- AlterTable
ALTER TABLE "MessageRecipient" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExtraNumber" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "ExtraNumber_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExtraNumber" ADD CONSTRAINT "ExtraNumber_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
