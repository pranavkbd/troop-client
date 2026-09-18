"use server";

import { revalidatePath } from "next/cache";

import { employees } from "@/lib/mock-data";

const PIN_PATTERN = /^\d{4,6}$/;

export interface ChangePinState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function changeEmployeePin(
  _prevState: ChangePinState,
  formData: FormData,
): Promise<ChangePinState> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const adminId = String(formData.get("adminId") ?? "");
  const adminPin = String(formData.get("adminPin") ?? "");
  const newPin = String(formData.get("newPin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");

  const admin = employees.find((e) => e.id === adminId);
  if (!admin || admin.role !== "Admin" || admin.pin !== adminPin) {
    return { status: "error", message: "Admin authorization failed." };
  }

  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) {
    return { status: "error", message: "Employee not found." };
  }

  if (!PIN_PATTERN.test(newPin)) {
    return { status: "error", message: "PIN must be 4-6 digits." };
  }
  if (newPin !== confirmPin) {
    return {
      status: "error",
      message: "New PIN and confirmation don't match.",
    };
  }

  employee.pin = newPin;

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/attendance");

  return { status: "success", message: `PIN updated for ${employee.name}.` };
}
