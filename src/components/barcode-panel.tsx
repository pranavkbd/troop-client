"use client";

import {
  CheckIcon,
  PrinterIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { BarcodeImage } from "@/components/barcode-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type ReplaceBarcodeState,
  replaceBarcodeAction,
} from "@/lib/barcode-actions";
import { usePrintQueue } from "@/lib/print-queue";
import type { Barcode, BarcodeOwnerKind, BarcodeVoidReason } from "@/lib/types";

const REASON_LABELS: Record<BarcodeVoidReason, string> = {
  lost: "Lost",
  damaged: "Damaged",
  other: "Other",
};

const initialState: ReplaceBarcodeState = { status: "idle" };

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Replace dialog
// ---------------------------------------------------------------------------

function ReplaceBarcodeDialog({
  barcode,
  ownerName,
}: {
  barcode: Barcode;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    replaceBarcodeAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state]);

  const [signedInEmployeeId, setSignedInEmployeeId] = useState("");
  useEffect(() => {
    try {
      setSignedInEmployeeId(
        window.localStorage.getItem("troop.signedInEmployeeId") ?? "",
      );
    } catch {
      setSignedInEmployeeId("");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <RefreshCwIcon />
        Replace barcode
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Replace {ownerName}&apos;s barcode?</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-1">
              <p>
                The current barcode{" "}
                <span className="font-mono font-medium">{barcode.value}</span>{" "}
                <strong>will stop working</strong> and a new one will be issued.
              </p>
              <p>This action cannot be undone.</p>
            </div>
          </div>

          <input type="hidden" name="barcodeId" value={barcode.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="replace-reason">Reason</Label>
            <Select
              name="reason"
              required
              defaultValue="lost"
              items={(Object.keys(REASON_LABELS) as BarcodeVoidReason[]).map(
                (reason) => ({ value: reason, label: REASON_LABELS[reason] }),
              )}
            >
              <SelectTrigger id="replace-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REASON_LABELS) as BarcodeVoidReason[]).map(
                  (reason) => (
                    <SelectItem key={reason} value={reason}>
                      {REASON_LABELS[reason]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="replace-note">
              Note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="replace-note"
              name="note"
              rows={2}
              maxLength={200}
              placeholder="e.g. Left on the bus, parent asked for a new one"
            />
          </div>
          <input type="hidden" name="employeeId" value={signedInEmployeeId} />

          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Replacing…" : "Yes, replace it"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

interface BarcodePanelProps {
  owner: { kind: BarcodeOwnerKind; id: string; name: string };
  /** The active barcode. */
  barcode: Barcode;
  /** Previously voided barcodes, newest first. */
  history: Barcode[];
}

export function BarcodePanel({ owner, barcode, history }: BarcodePanelProps) {
  const queue = usePrintQueue();
  const queued = queue.has({ kind: owner.kind, id: owner.id });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BarcodeImage
            value={barcode.value}
            module={2}
            height={40}
            hideLabel
            className="rounded-md border px-2 py-1.5"
          />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-medium tracking-wider">
              {barcode.value}
            </span>
            <span className="text-muted-foreground text-xs">
              Issued {formatWhen(barcode.issuedAt)} by {barcode.issuedBy}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {queued ? (
            <Button
              size="sm"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/print" />}
            >
              <CheckIcon />
              In print queue
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => queue.add([{ kind: owner.kind, id: owner.id }])}
            >
              <PrinterIcon />
              Add to print queue
            </Button>
          )}
          <ReplaceBarcodeDialog barcode={barcode} ownerName={owner.name} />
        </div>
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Previous barcodes
          </h3>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Replaced</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((old) => (
                  <TableRow key={old.id} className="text-muted-foreground">
                    <TableCell className="font-mono text-xs line-through">
                      {old.value}
                    </TableCell>
                    <TableCell>{formatWhen(old.issuedAt)}</TableCell>
                    <TableCell>
                      {old.voidedAt ? formatWhen(old.voidedAt) : "—"}
                      {old.voidedBy ? ` by ${old.voidedBy}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {old.voidReason ? (
                          <Badge variant="outline" className="w-fit">
                            {REASON_LABELS[old.voidReason]}
                          </Badge>
                        ) : (
                          "—"
                        )}
                        {old.voidNote ? (
                          <span className="text-xs">{old.voidNote}</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
