"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { DataTableFeatures } from "@/components/data-table-features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee, EmployeeRole } from "@/lib/types";

const roleVariant: Record<EmployeeRole, "default" | "secondary"> = {
  "Front Desk": "secondary",
  Instructor: "default",
};

const columnHelper = createColumnHelper<DataTableFeatures, Employee>();

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
  columnHelper.accessor("name", {
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
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant={roleVariant[row.original.role]}>
        {row.original.role}
      </Badge>
    ),
    sortFn: "alphanumeric",
  }),
]);
