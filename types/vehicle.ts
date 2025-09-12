import { vehicleType } from "../src/generated/prisma";

// ---------------- CREATE VEHICLE ----------------
export interface iCreatedVehicle {
  vehicleNo: string; // Vehicle number is required
  name: vehicleType;
  driverId: string;

  // Must be one of the enum values: Hiace, Noah, Bus, Taxi
}

// ---------------- UPDATE VEHICLE ----------------
export interface iUpdatedVehicle {
  id: string; // Vehicle ID is required
  vehicleNo?: string; // Optional new vehicle number
  name?: vehicleType;
  driverId: string;
  // Optional new vehicle type
}

// ---------------- VEHICLE RESPONSE TYPE ----------------
export interface iVehicle {
  id: string;
  vehicleNo: string;
  name: vehicleType;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isAvailable: boolean;
    isVerified: boolean;
  }[];
}
