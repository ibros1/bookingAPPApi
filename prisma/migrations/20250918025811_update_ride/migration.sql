/*
  Warnings:

  - Changed the type of `takenSeats` on the `scheduleRide` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Seats" DROP CONSTRAINT "Seats_scheduleRideId_fkey";

-- AlterTable
ALTER TABLE "public"."Seats" ADD COLUMN     "vehicleId" TEXT;

-- AlterTable
ALTER TABLE "public"."scheduleRide" DROP COLUMN "takenSeats",
ADD COLUMN     "takenSeats" JSONB NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Seats" ADD CONSTRAINT "Seats_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
