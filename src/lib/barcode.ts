import type { Employee, Student } from "@/lib/types";

/**
 * Barcode payloads are prefixed so a scan station can tell which kind of
 * badge it just read: students are "S" + student ID, employees are "E" +
 * a zero-padded sequence number.
 */
export const STUDENT_BARCODE_PREFIX = "S";
export const EMPLOYEE_BARCODE_PREFIX = "E";

export function studentBarcode(studentId: string): string {
  return `${STUDENT_BARCODE_PREFIX}${studentId}`;
}

export function employeeBarcode(sequence: number): string {
  return `${EMPLOYEE_BARCODE_PREFIX}${String(sequence).padStart(5, "0")}`;
}

/** Trims whitespace and upper-cases, so hand-typed codes match printed ones. */
export function normalizeBarcode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Resolves a scanned value to a student. Accepts the printed barcode or, as a
 * fallback for staff typing at a keyboard, the bare student ID.
 */
export function findStudentByBarcode(
  students: readonly Student[],
  raw: string,
): Student | undefined {
  const code = normalizeBarcode(raw);
  if (!code) return undefined;
  return (
    students.find((student) => student.barcode === code) ??
    students.find((student) => student.id === code)
  );
}

export function findEmployeeByBarcode<T extends Pick<Employee, "barcode">>(
  employees: readonly T[],
  raw: string,
): T | undefined {
  const code = normalizeBarcode(raw);
  if (!code) return undefined;
  return employees.find((employee) => employee.barcode === code);
}

export function looksLikeStudentBarcode(raw: string): boolean {
  return /^S\d+$/.test(normalizeBarcode(raw));
}

export function looksLikeEmployeeBarcode(raw: string): boolean {
  return /^E\d+$/.test(normalizeBarcode(raw));
}

// ---------------------------------------------------------------------------
// Code 39 encoding — used to render printable barcodes. Code 39 is read by
// every commodity USB scanner out of the box, and its symbol set (digits and
// upper-case letters) covers our "S100001" / "E00001" payloads.
// ---------------------------------------------------------------------------

/**
 * Each symbol is nine elements alternating bar/space, starting with a bar.
 * "1" is wide, "0" is narrow.
 */
const CODE39_PATTERNS: Record<string, string> = {
  "0": "000110100",
  "1": "100100001",
  "2": "001100001",
  "3": "101100000",
  "4": "000110001",
  "5": "100110000",
  "6": "001110000",
  "7": "000100101",
  "8": "100100100",
  "9": "001100100",
  A: "100001001",
  B: "001001001",
  C: "101001000",
  D: "000011001",
  E: "100011000",
  F: "001011000",
  G: "000001101",
  H: "100001100",
  I: "001001100",
  J: "000011100",
  K: "100000011",
  L: "001000011",
  M: "101000010",
  N: "000010011",
  O: "100010010",
  P: "001010010",
  Q: "000000111",
  R: "100000110",
  S: "001000110",
  T: "000010110",
  U: "110000001",
  V: "011000001",
  W: "111000000",
  X: "010010001",
  Y: "110010000",
  Z: "011010000",
  "-": "010000101",
  ".": "110000100",
  " ": "011000100",
  $: "010101000",
  "/": "010100010",
  "+": "010001010",
  "%": "000101010",
  "*": "010010100",
};

export interface Code39Bar {
  /** X offset in narrow-module units. */
  x: number;
  /** Width in narrow-module units (1 = narrow, 3 = wide). */
  width: number;
}

const WIDE_RATIO = 3;

/**
 * Lays out a Code 39 symbol as a list of bars in module units. Returns null
 * when the value contains a character Code 39 can't encode.
 */
export function encodeCode39(
  value: string,
): { bars: Code39Bar[]; totalWidth: number } | null {
  const text = normalizeBarcode(value);
  if (!text) return null;

  const symbols = ["*", ...text.split(""), "*"];
  const bars: Code39Bar[] = [];
  let x = 0;

  for (const [index, symbol] of symbols.entries()) {
    const pattern = CODE39_PATTERNS[symbol];
    if (!pattern) return null;

    for (const [position, element] of pattern.split("").entries()) {
      const width = element === "1" ? WIDE_RATIO : 1;
      const isBar = position % 2 === 0;
      if (isBar) bars.push({ x, width });
      x += width;
    }

    // Inter-character gap (one narrow space) between symbols, not after the last.
    if (index < symbols.length - 1) x += 1;
  }

  return { bars, totalWidth: x };
}
