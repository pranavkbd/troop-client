"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Student, StudentStatus } from "@/lib/types";

import type { DataTableFeatures } from "./data-table-features";

const statusVariant: Record<
  StudentStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  paused: "secondary",
  inactive: "outline",
};

const columnHelper = createColumnHelper<DataTableFeatures, Student>();

export const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    id: "id",
    header: () => <span className="pl-2">ID</span>,
    cell: ({ row }) => (
      <span className="text-muted-foreground pl-2 font-mono text-xs">
        {row.original.id}
      </span>
    ),
  }),
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.display({
    id: "levels",
    header: "Levels",
    cell: ({ row }) => (
      <div className="flex gap-1.5">
        {Object.entries(row.original.levels).map(([subject, level]) => (
          <Badge key={subject} variant="secondary">
            {subject} {level}
          </Badge>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor("guardianName", {
    id: "guardian",
    header: "Guardian",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.guardianName}</span>
    ),
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    sortFn: "alphanumeric",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;

      return (
        // biome-ignore lint/a11y/noStaticElementInteractions: only stops the click from bubbling to the row's own click handler
        // biome-ignore lint/a11y/useKeyWithClickEvents: not a standalone interactive control, just a bubbling guard
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-8 w-8 p-0" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(student.id)}
                >
                  Copy student ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={`/students/${student.id}`} />}
                >
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem>Edit student</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }),
]);
