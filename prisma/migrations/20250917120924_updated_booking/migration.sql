/*
  Warnings:

  - Made the column `paymentType` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."paymentType" AS ENUM ('ZAAD', 'eDAHAB', 'KAASH_PLUS', 'BANK', 'OFFLINE', 'CASH');

-- AlterTable
ALTER TABLE "public"."Booking" ALTER COLUMN "paymentType" SET NOT NULL;
