import { type ScanEmployee, ScanStation } from "@/components/scan-station";
import { employees } from "@/lib/mock-data";

export default function ScanPage() {
  const scanEmployees: ScanEmployee[] = employees.map(
    ({ id, name, barcode }) => ({ id, name, barcode }),
  );

  return <ScanStation employees={scanEmployees} />;
}
