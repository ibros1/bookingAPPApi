import { Sex, Status } from "../src/generated/prisma";

export interface iCreatedEmployee {
  userId: string;
  name: string;
  phone: string;
  sex: Sex;
  position?: string;
  address?: string;
  status: Status;
  notes?: string;
  salary?: number;
}
export interface iUpdatedEmployee {
  id: string;
  name: string;
  phone: string;
  sex: Sex;
  position?: string;
  address?: string;
  status: Status;
  notes?: string;
  salary?: number;
}
