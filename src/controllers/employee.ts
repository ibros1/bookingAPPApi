import { Request, Response } from "express";
import { iCreatedEmployee, iUpdatedEmployee } from "../../types/employee";
import { PrismaClient } from "../generated/prisma";
import { logActivity } from "../../middleWare/prismaLogger";
import { authRequest } from "../../types/request";

const prisma = new PrismaClient();

// ------------------ Create Employees ------------------
export const createEmployees = async (req: Request, res: Response) => {
  try {
    const data: iCreatedEmployee[] = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        isSuccess: false,
        message: "Request body must contain an array of employees",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: data[0].userId },
    });

    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User not found",
      });
    }

    const errors: any[] = [];
    const employeesToCreate = [];

    for (const emp of data) {
      if (!emp.name || !emp.phone || !emp.sex || !emp.status || !emp.userId) {
        errors.push({ employee: emp, message: "Missing required fields" });
        continue;
      }

      const existingPhone = await prisma.employee.findUnique({
        where: { phone: emp.phone },
      });
      if (existingPhone) {
        errors.push({
          employee: emp,
          message: "Phone number already exists",
        });
        continue;
      }

      employeesToCreate.push({
        name: emp.name,
        phone: emp.phone,
        sex: emp.sex,
        status: emp.status,
        position: emp.position || null,
        address: emp.address || null,
        salary: emp.salary || null,
        notes: emp.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: emp.userId,
      });
    }

    if (employeesToCreate.length === 0) {
      return res.status(400).json({
        isSuccess: false,
        message: "No valid employee data to insert",
        errors,
      });
    }

    // 1️⃣ Create employees in bulk
    const created = await prisma.employee.createMany({
      data: employeesToCreate,
      skipDuplicates: true,
    });

    // 2️⃣ Fetch created employees to get their IDs
    const createdEmployees = await prisma.employee.findMany({
      where: {
        phone: {
          in: employeesToCreate.map((e) => e.phone),
        },
      },
    });

    // 3️⃣ Log activities
    const logs = createdEmployees.map((emp) => ({
      targetId: emp.id,
      details: {
        creatorName: user.name,
        creatorPhone: user.phone,
        creatorEmail: user.email,
        creatorRole: user.role,
        message: `Employee ${emp.name} created by ${user.name}`,
        employee: emp,
      },
    }));
    await logActivity(user.id, "EMPLOYEE_CREATED", "EMPLOYEE", undefined, logs);

    res.status(201).json({
      isSuccess: true,
      message: "Employees created successfully",
      insertedCount: created.count,
      errors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal server error",
      error,
    });
  }
};

// ------------------ Get All Employees ------------------
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);

    const [employee, total] = await Promise.all([
      prisma.employee.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count(),
    ]);

    if (!employee) {
      return res.status(404).json({
        isSuccess: false,
        message: "No employees found",
      });
    }

    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
      isSuccess: true,
      message: "Employees fetched successfully",
      employee,
      total,
      page,
      perPage: limit,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Internal server error",
      error,
    });
  }
};

// Get One Employee by Number
export const getOneEmployeeByNumber = async (req: Request, res: Response) => {
  try {
    const phone = req.query.phone as string;
    console.log(phone);
    if (!phone) {
      res
        .status(400)
        .json({ isSuccess: false, message: "Phone number is required" });
      return;
    }
    const checkPhone = await prisma.employee.findUnique({
      where: { phone: phone },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            phone: true,
          },
        },
      },
    });
    if (!checkPhone) {
      res.status(404).json({ isSuccess: false, message: "Employee not found" });
      return;
    }
    res.status(200).json({ isSuccess: true, employee: checkPhone });
  } catch (error) {
    res.status(500).json({ isSuccess: false, message: "Server error", error });
  }
};

// ------------------ Get One Employee by ID ------------------
export const getOneEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            phone: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        isSuccess: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      isSuccess: true,
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
      error,
    });
  }
};

// ------------------ Update Employee ------------------
export const updateEmployee = async (req: authRequest, res: Response) => {
  try {
    const data: iUpdatedEmployee = req.body;

    if (!data.id) {
      return res.status(400).json({
        isSuccess: false,
        message: "Employee id is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User not found",
      });
    }

    const employeeExists = await prisma.employee.findUnique({
      where: { id: data.id },
    });

    if (!employeeExists) {
      return res.status(404).json({
        isSuccess: false,
        message: "Employee not found",
      });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: data.id },
      data,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });

    await logActivity(user.id, "EMPLOYEE_UPDATED", "EMPLOYEE", data.id, {
      message: `Employee ${updatedEmployee.name} updated by ${user.name}`,
      before: employeeExists,
      after: updatedEmployee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
      error,
    });
  }
};

// ------------------ Delete Employee ------------------
export const deleteEmployee = async (req: authRequest, res: Response) => {
  try {
    const { employeeId } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({
        isSuccess: false,
        message: "Employee not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User not found",
      });
    }

    const deletedEmployee = await prisma.employee.delete({
      where: { id: employeeId },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Employee deleted successfully",
      deletedEmployee,
    });

    await logActivity(user.id, "EMPLOYEE_DELETED", "EMPLOYEE", employeeId, {
      message: `Employee ${employee.name} deleted by ${user.name}`,
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Server error",
      error,
    });
  }
};
