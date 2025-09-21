import { Days } from "../src/generated/prisma/client";

// ---------- SCHEDULE RIDE ----------
export interface iCreatedScheduleRide {
  routeId: string;
  userId: string;
  vehicleId: string;
  driverId: string;
  fareUSD: number;
  fareSLSH: number;
  totalSeats: number;
  startTime: Date;
  endTime: Date;
  day: Days;
}

export interface iUpdatedScheduleRide {
  id: string;
  fareUSD: number;
  fareSLSH: number;
  totalSeats?: number;
  startTime?: Date;
  endTime?: Date;
  day?: Days;
}
