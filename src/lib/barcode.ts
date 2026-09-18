import type { BarcodeOwnerKind } from "@/lib/types";

/**
 * Barcode values are prefixed so the kiosk can tell whose barcode it just
 * read, and end in a check digit so a misread or a typo is caught by the app
 * itself, independent of the scanner or the symbology:
 *
 *   students   "S" + 7-digit serial + check digit   e.g. S50000015
 *   employees  "E" + 5-digit serial + check digit   e.g. E100017
 *
 * The serial belongs to the barcode, not the person, so a lost tag can be
 * replaced; see the Barcode type.
 */
export const STUDENT_BARCODE_PREFIX = "S";
export const EMPLOYEE_BARCODE_PREFIX = "E";

const STUDENT_BODY = /^S(\d{7})(\d)$/;
const EMPLOYEE_BODY = /^E(\d{5})(\d)$/;

// ---------------------------------------------------------------------------
// Check digit — Luhn over the code with letters mapped to two digits
// (A=10 … Z=35), the same extension ISO 7812 uses for alphanumeric IDs. It
// catches every single-digit error and nearly every adjacent transposition.
// ---------------------------------------------------------------------------

function digitize(payload: string): string {
  let out = "";
  for (const ch of payload) {
    if (/\d/.test(ch)) out += ch;
    else out += String(ch.toUpperCase().charCodeAt(0) - 55);
  }
  return out;
}

export function luhnCheckDigit(payload: string): string {
  const digits = digitize(payload);
  let sum = 0;
  let double = true; // the check digit itself will occupy the rightmost slot
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return String((10 - (sum % 10)) % 10);
}

export function withCheckDigit(payload: string): string {
  return `${payload}${luhnCheckDigit(payload)}`;
}

export function hasValidCheckDigit(code: string): boolean {
  if (code.length < 2) return false;
  return luhnCheckDigit(code.slice(0, -1)) === code.slice(-1);
}

export function barcodeValue(kind: BarcodeOwnerKind, serial: string): string {
  const prefix =
    kind === "student" ? STUDENT_BARCODE_PREFIX : EMPLOYEE_BARCODE_PREFIX;
  return withCheckDigit(`${prefix}${serial}`);
}

/** Trims whitespace and upper-cases, so hand-typed codes match printed ones. */
export function normalizeBarcode(raw: string): string {
  return raw.trim().toUpperCase();
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export type ParsedBarcode =
  | { ok: true; kind: BarcodeOwnerKind; value: string; serial: string }
  | {
      ok: false;
      value: string;
      /** "check": right shape, wrong check digit — almost always a misread. */
      reason: "format" | "check";
      kind?: BarcodeOwnerKind;
    };

export function parseBarcode(raw: string): ParsedBarcode {
  const value = normalizeBarcode(raw);
  const student = STUDENT_BODY.exec(value);
  if (student) {
    return hasValidCheckDigit(value)
      ? { ok: true, kind: "student", value, serial: student[1] }
      : { ok: false, value, reason: "check", kind: "student" };
  }
  const employee = EMPLOYEE_BODY.exec(value);
  if (employee) {
    return hasValidCheckDigit(value)
      ? { ok: true, kind: "employee", value, serial: employee[1] }
      : { ok: false, value, reason: "check", kind: "employee" };
  }
  return { ok: false, value, reason: "format" };
}

/** Human-readable reason a value was rejected, or null if it parsed. */
export function barcodeProblem(raw: string): string | null {
  const parsed = parseBarcode(raw);
  if (parsed.ok) return null;
  if (parsed.reason === "check") {
    return `Check digit doesn't match (read "${parsed.value}"). Likely a misread; scan again.`;
  }
  return `Not a Troop barcode (read "${parsed.value}").`;
}

/** Client-side lookup against a list that carries each person's active value. */
export function findByBarcode<T extends { barcode: string }>(
  people: readonly T[],
  raw: string,
): T | undefined {
  const parsed = parseBarcode(raw);
  if (!parsed.ok) return undefined;
  return people.find((person) => person.barcode === parsed.value);
}

/** Shape checks that ignore the check digit, for "wrong kind of badge" hints. */
export function looksLikeStudentBarcode(raw: string): boolean {
  return /^S\d+$/.test(normalizeBarcode(raw));
}

export function looksLikeEmployeeBarcode(raw: string): boolean {
  return /^E\d+$/.test(normalizeBarcode(raw));
}

/** A code that is the right length to submit, whether or not it validates. */
export const COMPLETE_BARCODE = /^(?:E\d{6}|S\d{8})$/i;

// ---------------------------------------------------------------------------
// Code 128 encoding — used to render printable barcodes. Continuous, dense,
// and every symbol carries a mandatory modulo-103 checksum, so a damaged
// label fails to read rather than reading wrong.
// ---------------------------------------------------------------------------

/**
 * Element widths for symbol values 0–106: six alternating bar/space widths
 * per symbol (eleven modules), plus the thirteen-module stop pattern.
 */
const CODE128_PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
];

const START_B = 104;
const START_C = 105;
const CODE_C = 99;
const CODE_B = 100;
const STOP = 106;

export interface BarcodeBar {
  /** X offset in modules. */
  x: number;
  /** Width in modules. */
  width: number;
}

/**
 * Chooses symbols for the value: code set B for letters, code set C for runs
 * of digit pairs (two digits per symbol), which is what makes "S10000015"
 * come out around 110 modules wide.
 */
function code128Symbols(text: string): number[] | null {
  const symbols: number[] = [];
  let i = 0;
  let set: "B" | "C" | null = null;

  const digitRun = (from: number) => {
    let n = 0;
    while (from + n < text.length && /\d/.test(text[from + n])) n++;
    return n;
  };

  while (i < text.length) {
    const run = digitRun(i);
    // Switch to C for runs of four or more digits, or an even run that ends
    // the value. An odd run spends its first digit in set B so the rest pairs
    // up cleanly.
    const wantC = run >= 4 || (run >= 2 && i + run === text.length);
    if (wantC && run % 2 === 1) {
      if (set !== "B") {
        symbols.push(set === null ? START_B : CODE_B);
        set = "B";
      }
      symbols.push(text.charCodeAt(i) - 32);
      i++;
      continue;
    }
    if (wantC) {
      if (set !== "C") {
        symbols.push(set === null ? START_C : CODE_C);
        set = "C";
      }
      const pairs = Math.floor(run / 2);
      for (let p = 0; p < pairs; p++) {
        symbols.push(Number(text.slice(i, i + 2)));
        i += 2;
      }
      continue;
    }
    if (set !== "B") {
      symbols.push(set === null ? START_B : CODE_B);
      set = "B";
    }
    const codePoint = text.charCodeAt(i);
    if (codePoint < 32 || codePoint > 126) return null;
    symbols.push(codePoint - 32);
    i++;
  }
  return symbols;
}

export function encodeCode128(
  value: string,
): { bars: BarcodeBar[]; totalWidth: number } | null {
  const text = normalizeBarcode(value);
  if (!text) return null;
  const symbols = code128Symbols(text);
  if (!symbols) return null;

  let checksum = symbols[0];
  for (let i = 1; i < symbols.length; i++) checksum += symbols[i] * i;
  symbols.push(checksum % 103, STOP);

  const bars: BarcodeBar[] = [];
  let x = 0;
  for (const symbol of symbols) {
    const pattern = CODE128_PATTERNS[symbol];
    for (const [position, ch] of pattern.split("").entries()) {
      const width = Number(ch);
      if (position % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { bars, totalWidth: x };
}
