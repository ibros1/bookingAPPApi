-- DropForeignKey
ALTER TABLE "public"."address" DROP CONSTRAINT "address_officerId_fkey";

-- CreateTable
CREATE TABLE "public"."_OfficerAddresses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OfficerAddresses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OfficerAddresses_B_index" ON "public"."_OfficerAddresses"("B");

-- AddForeignKey
ALTER TABLE "public"."_OfficerAddresses" ADD CONSTRAINT "_OfficerAddresses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_OfficerAddresses" ADD CONSTRAINT "_OfficerAddresses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
