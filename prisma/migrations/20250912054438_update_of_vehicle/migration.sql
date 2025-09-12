/*
  Warnings:

  - Added the required column `driverId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Vehicle" ADD COLUMN     "driverId" TEXT NOT NULL;
