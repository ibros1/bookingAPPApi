/*
  Warnings:

  - Added the required column `address` to the `PendingRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PendingRegistration" ADD COLUMN     "address" TEXT NOT NULL;
