"use client";

import { useMemo, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Student } from "@/lib/types";

interface PresentEntry {
  student: Student;
  checkInTime: string;
}

interface AttendanceBoardProps {
  formattedToday: string;
  allStudents: Student[];
  initialPresentStudents: PresentEntry[];
}

function formatTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function AttendanceBoard({
  formattedToday,
  allStudents,
  initialPresentStudents,
}: AttendanceBoardProps) {
  const [present, setPresent] = useState<Map<string, PresentEntry>>(
    () => new Map(initialPresentStudents.map((entry) => [entry.student.id, entry]))
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [staged, setStaged] = useState<Student[]>([]);

  const presentList = useMemo(() => Array.from(present.values()), [present]);
  const stagedIds = useMemo(() => new Set(staged.map((s) => s.id)), [staged]);

  const searchResults = allStudents.filter(
    (student) =>
      !present.has(student.id) &&
      !stagedIds.has(student.id) &&
      `${student.firstName} ${student.lastName} ${student.id}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  function addToStaged(student: Student) {
    setStaged((prev) => [...prev, student]);
  }

  function removeFromStaged(studentId: string) {
    setStaged((prev) => prev.filter((s) => s.id !== studentId));
  }

  function handleDialogOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStaged([]);
      setQuery("");
    }
  }

  function handleSubmit() {
    const checkInTime = formatTime(new Date());
    setPresent((prev) => {
      const next = new Map(prev);
      for (const student of staged) {
        next.set(student.id, { student, checkInTime });
      }
      return next;
    });
    setStaged([]);
    setQuery("");
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Attendance</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {formattedToday}
        </CardTitle>
        <CardAction>
          <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger render={<Button variant="outline" size="icon" />}>
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Add students</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add students</DialogTitle>
                <DialogDescription>
                  Search for students and add them to today&apos;s attendance.
                </DialogDescription>
              </DialogHeader>

              <Input
                placeholder="Search students..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />

              <div className="h-64 overflow-y-auto rounded-lg border">
                {searchResults.length === 0 ? (
                  <p className="text-muted-foreground p-2 text-sm">
                    {query ? "No students found." : "Start typing to search."}
                  </p>
                ) : (
                  searchResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => addToStaged(student)}
                      className="hover:bg-muted flex w-full items-center justify-between px-2.5 py-1.5 text-left text-sm"
                    >
                      <span>
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {student.id}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {staged.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No students added yet.
                  </p>
                ) : (
                  staged.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border px-2.5 py-1.5"
                    >
                      <span className="text-sm font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">
                          {student.id}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFromStaged(student.id)}
                        >
                          <XIcon className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleSubmit} disabled={staged.length === 0}>
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Check in time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentList.map(({ student, checkInTime }) => (
                <TableRow key={student.id}>
                  <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                    {student.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {checkInTime}
                  </TableCell>
                </TableRow>
              ))}
              {presentList.length === 0 && (
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
      </CardContent>
    </Card>
  );
}
