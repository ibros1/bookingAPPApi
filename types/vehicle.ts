import { vehicleType } from "../src/generated/prisma";

// ---------------- CREATE VEHICLE ----------------
export interface iCreatedVehicle {
  vehicleNo: string;
  name: vehicleType;
  driverId: string;
  capacity: number;
}

// ---------------- UPDATE VEHICLE ----------------
export interface iUpdatedVehicle {
  id: string;
  vehicleNo?: string;
  name?: vehicleType;
  driverId: string;
}
