import { Role } from "../src/generated/prisma";

export interface iCreatedUser {
  name: string;
  email?: string;
  phone: string;
  password: string;

  confirmPassword: string;
  profilePhoto?: string;
}

export interface iUpdatedUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  password: string;
  profilePhoto?: string;
  isActive: boolean;
}

export interface iLoginUser {
  phone: string;
  password: string;
}

export interface iUpdatedRole {
  phone: string;
  role: Role;
}
