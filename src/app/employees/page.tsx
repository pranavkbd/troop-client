import { columns } from "@/app/employees/columns";
import { DataTable } from "@/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { employees } from "@/lib/mock-data";

export default function EmployeesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Employees
        </CardTitle>
        <CardDescription>{employees.length} employees.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={employees}
          rowHrefBase="/employees"
          searchPlaceholder="Search employees..."
          entityLabel="employee"
        />
      </CardContent>
    </Card>
  );
}
