-- AddForeignKey
ALTER TABLE "public"."hotel" ADD CONSTRAINT "hotel_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
