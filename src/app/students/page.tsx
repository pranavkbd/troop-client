import { columns } from "@/app/students/columns";
import { DataTable } from "@/app/students/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { students } from "@/lib/mock-data";

export default function StudentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Students
        </CardTitle>
        <CardDescription>{students.length} students enrolled.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={students} rowHrefBase="/students" />
      </CardContent>
    </Card>
  );
}
