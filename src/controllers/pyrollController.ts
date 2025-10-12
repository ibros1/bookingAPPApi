// src/controllers/payrollController.ts
import { Request, Response } from "express";
import { paymentType, PayrollStatus, PrismaClient } from "../generated/prisma";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { iGeneratedPayroll } from "../../types/pyroll";

const prisma = new PrismaClient();

const WAAFI_API_URL = process.env.WAAFI_API_URL || "";
const MERCHANT_UID = process.env.WAAFI_MERCHANT_UID || "";
const API_USER_ID = process.env.WAAFI_API_USER_ID || "";
const API_KEY = process.env.WAAFI_API_KEY || "";
const PAYMENT_METHOD = process.env.WAAFI_PAYMENT_METHOD || "MWALLET_ACCOUNT";

/**
 * Generate payroll entries for all active employees
 */
export const generatePayroll = async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({
    where: { status: "active" },
  });

  const data: iGeneratedPayroll = req.body;

  if (
    !data.allowances ||
    !data.deduction ||
    !Object.values(paymentType).includes(data.payments_type) ||
    !Object.values(PayrollStatus).includes(data.status)
  ) {
    return res
      .status(400)
      .json({ isSuccess: false, message: "All fields are required" });
  }

  const payrolls = [];
  for (const emp of employees) {
    const base = emp.salary || 0;
    const payroll = await prisma.payroll.create({
      data: {
        employeeId: emp.id,
        baseSalary: base,
        allowances: data.allowances,
        deductions: data.deduction,
        netPay: base + data.allowances - data.deduction,
        paymentType: data.payments_type,
        status: data.status,
      },
    });
    payrolls.push(payroll);
  }

  return res.json({
    isSuccess: true,
    message: "created Successfully",
    payrolls,
  });
};

/**
 * One-click: pay all pending payrolls via WaafiPay
 */
export const payAllSalaries = async () => {
  const pendingPayrolls = await prisma.payroll.findMany({
    where: { status: "PENDING" },
    include: { employee: true },
  });

  const results: any[] = [];

  for (const payroll of pendingPayrolls) {
    const referenceId = payroll.referenceId || `payroll-${payroll.id}`;
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const payload = {
      schemaVersion: "1.0",
      requestId,
      timestamp,
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: MERCHANT_UID,
        apiUserId: API_USER_ID,
        apiKey: API_KEY,
        paymentMethod: PAYMENT_METHOD,
        payerInfo: { accountNo: payroll.employee.phone },
        transactionInfo: {
          referenceId,
          invoiceId: referenceId,
          amount: payroll.netPay.toFixed(2),
          currency: "USD",
          description: `Salary Payment - ${new Date().toLocaleDateString()}`,
        },
      },
    };

    try {
      const { data } = await axios.post(WAAFI_API_URL, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      });

      const responseCode = data?.responseCode;
      const params = data?.params || {};
      const success =
        (responseCode === "2001" || responseCode === 2001) &&
        (params.state === "APPROVED" || params.state === "approved");

      if (success) {
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            transactionId: params.transactionId?.toString() || null,
            referenceId,
          },
        });
        results.push({ payrollId: payroll.id, status: "PAID" });
      } else {
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: { status: "FAILED", referenceId },
        });
        results.push({ payrollId: payroll.id, status: "FAILED" });
      }
    } catch (err: any) {
      await prisma.payroll.update({
        where: { id: payroll.id },
        data: { status: "FAILED", referenceId },
      });
      results.push({
        payrollId: payroll.id,
        status: "FAILED",
        error: err.message,
      });
    }
  }

  return results;
};

/**
 * Get payroll history by employee
 */
export const getPayrollHistory = async (employeeId: string) => {
  return prisma.payroll.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
};
