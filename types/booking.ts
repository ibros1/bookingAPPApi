import { currency, PaymentStatus, paymentType } from "../src/generated/prisma";

// ---------- BOOKING ----------
export interface iCreatedBooking {
  userId: string;
  scheduleRideId: string;
  seatIds: string[];
  name: string;
  phoneNumber: string;
  amount: number;
  qty: number;
  paymentType: paymentType;
  currency: currency;
  paymentStatus: PaymentStatus;
}

export interface iUpdatedBooking {
  id: string;
  paymentStatus?: PaymentStatus;
}
