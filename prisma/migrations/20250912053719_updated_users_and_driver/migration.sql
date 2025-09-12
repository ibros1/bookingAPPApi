/*
  Warnings:

  - You are about to drop the `Driver` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Driver" DROP CONSTRAINT "Driver_vehicleId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleId" TEXT;

-- DropTable
DROP TABLE "public"."Driver";

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
