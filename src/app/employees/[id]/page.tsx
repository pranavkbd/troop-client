import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChangePinForm } from "@/components/change-pin-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { employees } from "@/lib/mock-data";
import type { EmployeeRole } from "@/lib/types";

const roleVariant: Record<EmployeeRole, "default" | "secondary"> = {
  "Front Desk": "secondary",
  Instructor: "default",
  Admin: "default",
};

function initialsFor(name: string) {
  const parts = name.replace(".", "").split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function EmployeeDetailPage(
  props: PageProps<"/employees/[id]">,
) {
  const { id } = await props.params;
  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    notFound();
  }

  const admins = employees.filter((e) => e.role === "Admin");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/employees"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to employees
      </Link>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initialsFor(employee.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {employee.name}
              </h1>
              <Badge variant={roleVariant[employee.role]}>
                {employee.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Employee ID {employee.id}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change PIN</CardTitle>
          <CardDescription>
            Requires an admin to authorize the change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePinForm employee={employee} admins={admins} />
        </CardContent>
      </Card>
    </div>
  );
}
