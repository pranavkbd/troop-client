"use server";

import { applyAttendance } from "@/lib/attendance-service";
import {
  barcodeProblem,
  findEmployeeByBarcode,
  findStudentByBarcode,
} from "@/lib/barcode";
import { employees, students } from "@/lib/mock-data";
import {
  isScanAction,
  type ScanAction,
  type ScanInput,
  type ScanResult,
} from "@/lib/scan";

export async function recordScan(input: ScanInput): Promise<ScanResult> {
  const action: ScanAction = isScanAction(input.action)
    ? input.action
    : "check-in";
  if (!isScanAction(input.action)) {
    return { ok: false, action, message: "Unknown scan action." };
  }

  const employee = findEmployeeByBarcode(
    employees,
    String(input.employeeBarcode ?? ""),
  );
  if (!employee) {
    return { ok: false, action, message: "Employee badge not recognized." };
  }

  const student = findStudentByBarcode(
    students,
    String(input.studentBarcode ?? ""),
  );
  if (!student) {
    const raw = String(input.studentBarcode ?? "");
    return {
      ok: false,
      action,
      message: "Student barcode not recognized.",
      detail: barcodeProblem(raw) ?? `Read "${raw}", no matching student.`,
      employeeName: employee.name,
    };
  }

  return applyAttendance({
    action,
    employee,
    student,
    date: String(input.date ?? ""),
    time: String(input.time ?? ""),
  });
}
