import { type ScanEmployee, ScanStation } from "@/components/scan-station";
import { employees, getActiveBarcodeValues } from "@/lib/mock-data";

export default function KioskPage() {
  const values = getActiveBarcodeValues("employee");
  const scanEmployees: ScanEmployee[] = employees.flatMap(({ id, name }) => {
    const barcode = values[id];
    return barcode ? [{ id, name, barcode }] : [];
  });

  return <ScanStation employees={scanEmployees} />;
}
