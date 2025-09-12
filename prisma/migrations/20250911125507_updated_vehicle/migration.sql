/*
  Warnings:

  - A unique constraint covering the columns `[vehicleNo]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Driver_vehicleNo_key" ON "public"."Driver"("vehicleNo");
