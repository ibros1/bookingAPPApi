import { Role } from "../src/generated/prisma";

// ---------------- CREATE DRIVER ----------------
export interface iCreatedDriver {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean | string;
  role: Role;
  profilePhoto: string;
}

// ---------------- UPDATE DRIVER ----------------
export interface iUpdatedDriver {
  isActive: boolean | string;
}
