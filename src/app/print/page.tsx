import { type PrintablePerson, PrintQueue } from "@/components/print-queue";
import { employees, getActiveBarcodeValues, students } from "@/lib/mock-data";

/**
 * The print queue page. The queue itself lives in the browser; this page
 * supplies every person's current barcode so queued entries resolve to
 * whatever is active right now.
 */
export default function PrintPage() {
  const studentValues = getActiveBarcodeValues("student");
  const employeeValues = getActiveBarcodeValues("employee");

  const people: PrintablePerson[] = [
    ...students.map((s) => ({
      kind: "student" as const,
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      barcode: studentValues[s.id],
    })),
    ...employees.map((e) => ({
      kind: "employee" as const,
      id: e.id,
      name: e.name,
      barcode: employeeValues[e.id],
    })),
  ];

  return <PrintQueue people={people} />;
}
