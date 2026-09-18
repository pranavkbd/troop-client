export type ScanAction = "check-in" | "check-out" | "pick-up";

export const SCAN_ACTIONS: ScanAction[] = ["check-in", "check-out", "pick-up"];

export const SCAN_ACTION_LABELS: Record<ScanAction, string> = {
  "check-in": "Check In",
  "check-out": "Check Out",
  "pick-up": "Pick Up",
};

/** Past-tense phrasing for result screens: "Ava Nguyen checked in". */
export const SCAN_ACTION_DONE: Record<ScanAction, string> = {
  "check-in": "checked in",
  "check-out": "checked out",
  "pick-up": "picked up",
};

export function isScanAction(value: unknown): value is ScanAction {
  return (
    typeof value === "string" && (SCAN_ACTIONS as string[]).includes(value)
  );
}

export interface ScanSubject {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ScanInput {
  action: ScanAction;
  employeeBarcode: string;
  studentBarcode: string;
  /** Business day the scan belongs to, "yyyy-MM-dd" in the station's local time. */
  date: string;
  /** Wall-clock time of the scan, "HH:mm" in the station's local time. */
  time: string;
}

export type ScanResult =
  | {
      ok: true;
      action: ScanAction;
      student: ScanSubject;
      employeeName: string;
      date: string;
      time: string;
      /** Extra context worth surfacing, e.g. "Arrived 12 min late". */
      detail?: string;
    }
  | {
      ok: false;
      action: ScanAction;
      student?: ScanSubject;
      employeeName?: string;
      message: string;
      detail?: string;
    };
