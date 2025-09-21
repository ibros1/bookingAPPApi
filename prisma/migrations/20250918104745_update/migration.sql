/*
  Warnings:

  - You are about to drop the column `fare` on the `scheduleRide` table. All the data in the column will be lost.
  - Added the required column `fareSLSH` to the `scheduleRide` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fareUSD` to the `scheduleRide` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."scheduleRide" DROP COLUMN "fare",
ADD COLUMN     "fareSLSH" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fareUSD" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "takenSeats" SET DATA TYPE TEXT[];
