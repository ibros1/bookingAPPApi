-- DropForeignKey
ALTER TABLE "public"."MessageRecipient" DROP CONSTRAINT "MessageRecipient_employeeId_fkey";

-- AlterTable
ALTER TABLE "MessageRecipient" ALTER COLUMN "employeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MessageRecipient" ADD CONSTRAINT "MessageRecipient_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
