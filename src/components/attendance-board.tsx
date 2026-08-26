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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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

interface CheckedOutEntry {
  student: Student;
  checkInTime: string;
  checkOutTime: string;
}

interface AttendanceBoardProps {
  formattedToday: string;
  allStudents: Student[];
  initialPresentStudents: PresentEntry[];
  initialCheckedOutStudents: CheckedOutEntry[];
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
  initialCheckedOutStudents,
}: AttendanceBoardProps) {
  const [present, setPresent] = useState<Map<string, PresentEntry>>(
    () => new Map(initialPresentStudents.map((entry) => [entry.student.id, entry]))
  );
  const [checkedOut, setCheckedOut] = useState<Map<string, CheckedOutEntry>>(
    () =>
      new Map(initialCheckedOutStudents.map((entry) => [entry.student.id, entry]))
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [staged, setStaged] = useState<Student[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const presentList = useMemo(() => Array.from(present.values()), [present]);
  const checkedOutList = useMemo(
    () => Array.from(checkedOut.values()),
    [checkedOut]
  );
  const stagedIds = useMemo(() => new Set(staged.map((s) => s.id)), [staged]);

  const searchResults = allStudents.filter(
    (student) =>
      !present.has(student.id) &&
      !checkedOut.has(student.id) &&
      !stagedIds.has(student.id) &&
      `${student.firstName} ${student.lastName} ${student.id}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  function checkOutStudent(studentId: string) {
    const entry = present.get(studentId);
    if (!entry) return;

    setPresent((prev) => {
      const next = new Map(prev);
      next.delete(studentId);
      return next;
    });
    setCheckedOut((prev) => {
      const next = new Map(prev);
      next.set(studentId, { ...entry, checkOutTime: formatTime(new Date()) });
      return next;
    });
  }

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
      setSearchOpen(false);
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
    setSearchOpen(false);
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

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <Input
                      placeholder="Search students..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      autoFocus
                    />
                  }
                />
                <PopoverContent
                  align="start"
                  initialFocus={false}
                  className="w-(--anchor-width) max-h-64 overflow-y-auto p-1"
                >
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
                        className="hover:bg-muted flex w-full flex-col rounded-md px-2 py-1.5 text-left"
                      >
                        <span className="text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {student.id}
                        </span>
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              <Separator />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Added{staged.length > 0 && ` (${staged.length})`}
                </p>
                <div className="flex max-h-48 flex-col divide-y overflow-y-auto">
                  {staged.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No students added yet.
                    </p>
                  ) : (
                    staged.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {student.id}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFromStaged(student.id)}
                        >
                          <XIcon className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
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
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Present</p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Check in time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkOutStudent(student.id)}
                      >
                        Check out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {presentList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground text-center"
                    >
                      No students marked present.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Checked out</p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Check in time</TableHead>
                  <TableHead>Check out time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkedOutList.map(({ student, checkInTime, checkOutTime }) => (
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
                    <TableCell className="text-muted-foreground">
                      {checkOutTime}
                    </TableCell>
                  </TableRow>
                ))}
                {checkedOutList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground text-center"
                    >
                      No students checked out yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
