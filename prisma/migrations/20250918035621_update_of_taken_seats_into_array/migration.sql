/*
  Warnings:

  - The `takenSeats` column on the `scheduleRide` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."scheduleRide" DROP COLUMN "takenSeats",
ADD COLUMN     "takenSeats" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
