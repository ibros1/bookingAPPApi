/*
  Warnings:

  - Added the required column `qty` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "qty" INTEGER NOT NULL;
