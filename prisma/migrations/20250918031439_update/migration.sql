/*
  Warnings:

  - Changed the type of `paymentType` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `capacity` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "paymentType",
ADD COLUMN     "paymentType" "public"."paymentType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Vehicle" ADD COLUMN     "capacity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."scheduleRide" ALTER COLUMN "takenSeats" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Seats" ADD CONSTRAINT "Seats_scheduleRideId_fkey" FOREIGN KEY ("scheduleRideId") REFERENCES "public"."scheduleRide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
