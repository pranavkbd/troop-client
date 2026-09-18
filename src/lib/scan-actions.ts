"use server";

import { applyAttendance } from "@/lib/attendance-service";
import { barcodeProblem, parseBarcode } from "@/lib/barcode";
import { employees, getBarcodeByValue, students } from "@/lib/mock-data";
import {
  isScanAction,
  type ScanAction,
  type ScanInput,
  type ScanResult,
} from "@/lib/scan";
import type { Barcode } from "@/lib/types";

function voidedWhen(barcode: Barcode) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(barcode.voidedAt ?? ""));
}

export async function recordScan(input: ScanInput): Promise<ScanResult> {
  const action: ScanAction = isScanAction(input.action)
    ? input.action
    : "check-in";
  if (!isScanAction(input.action)) {
    return { ok: false, action, message: "Unknown scan action." };
  }

  // Employee badge
  const badgeRaw = String(input.employeeBarcode ?? "");
  const badge = parseBarcode(badgeRaw);
  const badgeRecord =
    badge.ok && badge.kind === "employee"
      ? getBarcodeByValue(badge.value)
      : undefined;
  const employee = badgeRecord
    ? employees.find((e) => e.id === badgeRecord.ownerId)
    : undefined;
  if (!badgeRecord || !employee) {
    return { ok: false, action, message: "Employee badge not recognized." };
  }
  if (badgeRecord.voidedAt) {
    return {
      ok: false,
      action,
      message: "That badge was replaced.",
      detail: `${badgeRecord.value} was voided ${voidedWhen(badgeRecord)}. Scan your current badge.`,
    };
  }

  // Student barcode
  const raw = String(input.studentBarcode ?? "");
  const parsed = parseBarcode(raw);
  const record =
    parsed.ok && parsed.kind === "student"
      ? getBarcodeByValue(parsed.value)
      : undefined;
  const student = record
    ? students.find((s) => s.id === record.ownerId)
    : undefined;
  if (!record || !student) {
    return {
      ok: false,
      action,
      message: "Student barcode not recognized.",
      detail:
        barcodeProblem(raw) ?? `Read "${raw}", no barcode with that number.`,
      employeeName: employee.name,
    };
  }
  if (record.voidedAt) {
    return {
      ok: false,
      action,
      message: "This barcode was replaced.",
      detail: `${record.value} was voided ${voidedWhen(record)}${record.voidReason ? ` (${record.voidReason})` : ""}. Scan ${student.firstName}'s current barcode.`,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
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
