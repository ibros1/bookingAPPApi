import { Role } from "../src/generated/prisma";

// ---------------- CREATE DRIVER ----------------
export interface iCreatedDriver {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  vehicleId: string;
  isAvailable: boolean;
}

// ---------------- UPDATE DRIVER ----------------
export interface iUpdatedDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleId?: string;
  vehicleNo?: string;
  isAvailable?: boolean;
  password?: string;
}

// ---------------- LOGIN DRIVER ----------------
export interface iLoginDriver {
  email: string;
  password: string;
}

// ---------------- UPDATE DRIVER ROLE ----------------
export interface iUpdatedRole {
  id: string;
  role: Role;
}
