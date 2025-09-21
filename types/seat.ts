// ---------- SEAT ----------
export interface iCreatedSeat {
  scheduleRideId: string;
  seatNumber: number;
}

export interface iUpdatedSeat {
  id: string;
  isBooked?: boolean;
}
