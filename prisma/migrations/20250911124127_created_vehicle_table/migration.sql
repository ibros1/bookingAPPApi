/*
  Warnings:

  - You are about to drop the column `vehicleTypeId` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `Driver` table. All the data in the column will be lost.
  - Added the required column `vehicleId` to the `Driver` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."vehicleType" AS ENUM ('Hiace', 'Noah', 'Bus', 'Taxi');

-- AlterTable
ALTER TABLE "public"."Driver" DROP COLUMN "vehicleTypeId",
DROP COLUMN "verificationToken",
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "vehicleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "name" "public"."vehicleType" NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Driver" ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
