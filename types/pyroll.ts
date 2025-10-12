import { paymentType, PayrollStatus } from "../src/generated/prisma";

export interface iGeneratedPayroll {
  allowances: number;
  deduction: number;
  payments_type: paymentType;
  status: PayrollStatus;
}
