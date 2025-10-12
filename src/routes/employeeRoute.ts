import { Router } from "express";
import {
  createEmployees,
  getAllEmployees,
  getOneEmployee,
  updateEmployee,
  deleteEmployee,
  getOneEmployeeByNumber,
} from "../controllers/employee";
import { authenticateUser } from "../../middleWare/authenticate";

const router = Router();

// Create single or multiple employees
router.post("/create", createEmployees);

// List all employees (with optional pagination)
router.get("/list", getAllEmployees);

router.get("/get_by_phone", getOneEmployeeByNumber);
// Get a single employee by ID
router.get("/:employeeId", getOneEmployee);

// Update an employee
router.put("/update", authenticateUser, updateEmployee);

// Delete an employee by ID
router.delete("/delete/:employeeId", deleteEmployee);

export default router;
