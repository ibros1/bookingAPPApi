import { Role } from "../src/generated/prisma";

export interface iCreatedUser {
  name?: string;
  email?: string;
  phone?: string;
  password: string;
  isActive: boolean | string;
  confirmPassword: string;
  profilePhoto?: string;
}

export interface iUpdatedUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isActive: boolean;

  password?: string;
}

export interface iLoginUser {
  email: string;
  password: string;
}

export interface iUpdatedRole {
  id: string;
  role: Role;
}
