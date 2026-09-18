import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScheduleToggleCards } from "@/components/schedule-experiments/schedule-toggle-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { students } from "@/lib/mock-data";

export default async function ScheduleExperimentTwoPage(
  props: PageProps<"/students/[id]/schedule-experiment-2">,
) {
  const { id } = await props.params;
  const student = students.find((s) => s.id === id);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/students/${id}`}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {student.firstName} {student.lastName}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Schedule experiment: toggle cards</CardTitle>
          <CardDescription>
            Tap a time card to toggle {student.firstName}&apos;s availability
            for that day and time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleToggleCards />
        </CardContent>
      </Card>
    </div>
  );
}
