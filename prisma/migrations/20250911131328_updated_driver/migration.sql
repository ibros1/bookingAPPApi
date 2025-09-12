/*
  Warnings:

  - You are about to drop the column `vehicleNo` on the `Driver` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Driver_vehicleNo_key";

-- AlterTable
ALTER TABLE "public"."Driver" DROP COLUMN "vehicleNo";
