"use server";

import { applyAttendance } from "@/lib/attendance-service";
import { employees, students } from "@/lib/mock-data";
import { isScanAction, type ScanAction, type ScanResult } from "@/lib/scan";

export interface BoardAttendanceInput {
  action: ScanAction;
  employeeId: string;
  studentId: string;
  date: string;
  time: string;
}

/** Records a check-in or check-out clicked on the attendance board. */
export async function recordBoardAttendance(
  input: BoardAttendanceInput,
): Promise<ScanResult> {
  const action: ScanAction = isScanAction(input.action)
    ? input.action
    : "check-in";
  if (!isScanAction(input.action)) {
    return { ok: false, action, message: "Unknown attendance action." };
  }

  const employee = employees.find((e) => e.id === input.employeeId);
  if (!employee) {
    return { ok: false, action, message: "Employee session not recognized." };
  }
  const student = students.find((s) => s.id === input.studentId);
  if (!student) {
    return {
      ok: false,
      action,
      message: "Student not found.",
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
