import { Currency, paymentType } from "../src/generated/prisma";

export interface iCreatedBooking {
  bookerId: string;
  rideId: string;
  currency: Currency;
  name: string;
  phoneNumber: string;
  amount: number;
  qty: number;
  total_amount: number;
  paymentType: paymentType;
}
