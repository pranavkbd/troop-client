"use server";

import { revalidatePath } from "next/cache";

import { employees, replaceBarcode } from "@/lib/mock-data";
import type { BarcodeVoidReason } from "@/lib/types";

export interface ReplaceBarcodeState {
  status: "idle" | "error" | "success";
  message?: string;
}

const VOID_REASONS: BarcodeVoidReason[] = ["lost", "damaged", "other"];

/**
 * Voids a person's current barcode and issues the next one. This is the only
 * barcode lifecycle action staff can take; status changes such as inactive
 * or vacation never touch the barcode.
 */
export async function replaceBarcodeAction(
  _prev: ReplaceBarcodeState,
  formData: FormData,
): Promise<ReplaceBarcodeState> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const staff = employees.find((e) => e.id === employeeId);
  if (!staff || staff.pin !== pin) {
    return { status: "error", message: "Employee PIN didn't match." };
  }

  const barcodeId = String(formData.get("barcodeId") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "");
  if (!(VOID_REASONS as string[]).includes(reasonRaw)) {
    return { status: "error", message: "Pick a reason for the replacement." };
  }

  try {
    const { voided, issued } = replaceBarcode({
      barcodeId,
      reason: reasonRaw as BarcodeVoidReason,
      employeeName: staff.name,
      at: new Date().toISOString(),
    });
    const base = issued.ownerKind === "student" ? "/students" : "/employees";
    revalidatePath(`${base}/${issued.ownerId}`);
    revalidatePath(base);
    revalidatePath("/print");
    revalidatePath("/kiosk");
    return {
      status: "success",
      message: `Replaced ${voided.value} with ${issued.value}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Couldn't replace barcode.",
    };
  }
}
