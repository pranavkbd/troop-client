"use server";

import { revalidatePath } from "next/cache";

import { employees, replaceBarcode } from "@/lib/mock-data";
import type { BarcodeVoidReason } from "@/lib/types";

export interface ReplaceBarcodeState {
  status: "idle" | "error" | "success";
  message?: string;
}

const VOID_REASONS: BarcodeVoidReason[] = ["lost", "damaged", "other"];

const NOTE_MAX = 200;

/**
 * Voids a person's current barcode and issues the next one. This is the only
 * barcode lifecycle action staff can take; status changes such as inactive
 * or vacation never touch the barcode. No PIN: it's a confirmation, and the
 * replacement is attributed to whoever is signed in on this device.
 */
export async function replaceBarcodeAction(
  _prev: ReplaceBarcodeState,
  formData: FormData,
): Promise<ReplaceBarcodeState> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const staff = employees.find((e) => e.id === employeeId);

  const barcodeId = String(formData.get("barcodeId") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "");
  if (!(VOID_REASONS as string[]).includes(reasonRaw)) {
    return { status: "error", message: "Pick a reason for the replacement." };
  }
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, NOTE_MAX);

  try {
    const { voided, issued } = replaceBarcode({
      barcodeId,
      reason: reasonRaw as BarcodeVoidReason,
      note: note || undefined,
      employeeName: staff?.name ?? "Staff",
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
