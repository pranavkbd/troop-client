"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  createColumnHelper,
  type RowData,
  type RowSelectionState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { PrinterIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePrintQueue } from "@/lib/print-queue";
import type { BarcodeOwnerKind } from "@/lib/types";

import { type DataTableFeatures, features } from "./data-table-features";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  /** Base path to navigate to on row click, e.g. "/students". Requires each row to have an `id` field. */
  rowHrefBase?: string;
  searchPlaceholder?: string;
  entityLabel?: string;
  /** Adds a checkbox column. Selection lives inside the table. */
  selectable?: boolean;
  /** Rows this returns false for get a disabled checkbox. */
  canSelectRow?: (row: TData) => boolean;
  /** Rendered in the toolbar while at least one row is selected. */
  selectionActions?: (selected: TData[], clear: () => void) => React.ReactNode;
  /**
   * Rows are people of this kind: turns on selection and adds an
   * "Add to print queue" action for the selected rows.
   */
  printQueueKind?: BarcodeOwnerKind;
}

export function DataTable<TData extends RowData & { id: string }>({
  columns,
  data,
  rowHrefBase,
  searchPlaceholder = "Search students...",
  entityLabel = "student",
  selectable: selectableProp = false,
  canSelectRow,
  selectionActions,
  printQueueKind,
}: DataTableProps<TData>) {
  const router = useRouter();
  const queue = usePrintQueue();
  const selectable = selectableProp || printQueueKind !== undefined;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});

  const allColumns = React.useMemo(() => {
    if (!selectable) return columns;
    const helper = createColumnHelper<DataTableFeatures, TData>();
    const selectColumn = helper.display({
      id: "select",
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked === true)
          }
        />
      ),
      cell: ({ row }) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: stops the click from also triggering row navigation
        // biome-ignore lint/a11y/useKeyWithClickEvents: bubbling guard only; the checkbox itself is keyboard-accessible
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        </div>
      ),
    });
    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useTable({
    features,
    data,
    columns: allColumns,
    getRowId: (row) => row.id,
    enableRowSelection: selectable
      ? canSelectRow
        ? (row) => canSelectRow(row.original)
        : true
      : false,
    initialState: {
      pagination: { pageSize: 20, pageIndex: 0 },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectableFiltered = table
    .getFilteredRowModel()
    .rows.filter((row) => row.getCanSelect());
  const clearSelection = () => table.resetRowSelection(true);
  const selectAllFiltered = () =>
    table.setRowSelection(
      Object.fromEntries(selectableFiltered.map((row) => [row.id, true])),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {selectable && selectedRows.length > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-2 py-1 text-sm">
            <span className="font-medium tabular-nums">
              {selectedRows.length} selected
            </span>
            {selectedRows.length < selectableFiltered.length ? (
              <Button variant="link" size="xs" onClick={selectAllFiltered}>
                Select all {selectableFiltered.length}
              </Button>
            ) : null}
            {printQueueKind ? (
              <Button
                size="xs"
                onClick={() => {
                  const added = queue.add(
                    selectedRows.map((row) => ({
                      kind: printQueueKind,
                      id: row.id,
                    })),
                  );
                  toast.success(
                    added === 0
                      ? "Already in the print queue."
                      : `Added ${added} to the print queue.`,
                    {
                      action: {
                        label: "View queue",
                        onClick: () => router.push("/print"),
                      },
                    },
                  );
                  clearSelection();
                }}
              >
                <PrinterIcon />
                Add to print queue
              </Button>
            ) : null}
            {selectionActions?.(selectedRows, clearSelection)}
            <Button variant="ghost" size="xs" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="ml-auto" />}
          >
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={rowHrefBase ? "cursor-pointer" : undefined}
                  onClick={
                    rowHrefBase
                      ? () => router.push(`${rowHrefBase}/${row.original.id}`)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} {entityLabel}(s).
        </div>
        {table.getPageCount() > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
