import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceStatus, Student } from "@/lib/types";

const statusVariant: Record<
  AttendanceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  present: "default",
  late: "secondary",
  excused: "outline",
  absent: "destructive",
};

interface AttendanceBoardProps {
  presentStudents: Student[];
}

export function AttendanceBoard({ presentStudents }: AttendanceBoardProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {presentStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                {student.id}
              </TableCell>
              <TableCell className="font-medium">
                {student.firstName} {student.lastName}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant.present}>present</Badge>
              </TableCell>
            </TableRow>
          ))}
          {presentStudents.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-muted-foreground text-center"
              >
                No students marked present.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
