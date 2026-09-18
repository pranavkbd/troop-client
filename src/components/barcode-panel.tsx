"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  PrinterIcon,
  RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { BarcodeTag } from "@/components/barcode-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ReplaceBarcodeState,
  replaceBarcodeAction,
} from "@/lib/barcode-actions";
import { usePrintQueue } from "@/lib/print-queue";
import type { Barcode, BarcodeOwnerKind, BarcodeVoidReason } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Only what the replace form needs; PINs stay on the server. */
export interface StaffOption {
  id: string;
  name: string;
}

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
  staff,
}: {
  barcode: Barcode;
  ownerName: string;
  staff: StaffOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    replaceBarcodeAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state]);

  const noun = barcode.ownerKind === "student" ? "tag" : "badge";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <RefreshCwIcon />
        Replace barcode
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Replace {ownerName}&apos;s barcode</DialogTitle>
            <DialogDescription>
              {barcode.value} stops working immediately and a new barcode is
              issued. Print the new {noun} afterwards.
            </DialogDescription>
          </DialogHeader>

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
            <Label htmlFor="replace-employee">Your name</Label>
            <Select
              name="employeeId"
              required
              items={staff.map((s) => ({ value: s.id, label: s.name }))}
            >
              <SelectTrigger id="replace-employee" className="w-full">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="replace-pin">Your PIN</Label>
            <Input
              id="replace-pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
            />
          </div>

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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Replacing…" : "Replace barcode"}
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
  staff: StaffOption[];
}

export function BarcodePanel({
  owner,
  barcode,
  history,
  staff,
}: BarcodePanelProps) {
  const queue = usePrintQueue();
  const queued = queue.has({ kind: owner.kind, id: owner.id });
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <BarcodeTag
            name={owner.name}
            value={barcode.value}
            className="w-fit min-w-72"
          />
          <p className="text-muted-foreground text-xs">
            Issued {formatWhen(barcode.issuedAt)} by {barcode.issuedBy}
          </p>
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
          <ReplaceBarcodeDialog
            barcode={barcode}
            ownerName={owner.name}
            staff={staff}
          />
        </div>
      </div>

      {history.length > 0 ? (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="text-muted-foreground flex items-center gap-1 text-xs font-medium hover:text-foreground">
            <ChevronRightIcon
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                historyOpen && "rotate-90",
              )}
            />
            {history.length} previous barcode{history.length === 1 ? "" : "s"}
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {history.map((old) => (
                <li
                  key={old.id}
                  className="text-muted-foreground flex flex-wrap items-center gap-2"
                >
                  <span className="font-mono text-xs line-through">
                    {old.value}
                  </span>
                  <span>
                    {formatWhen(old.issuedAt)} &ndash;{" "}
                    {old.voidedAt ? formatWhen(old.voidedAt) : "—"}
                    {old.voidedBy ? ` · by ${old.voidedBy}` : ""}
                  </span>
                  {old.voidReason ? (
                    <Badge variant="outline">
                      {REASON_LABELS[old.voidReason]}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </CollapsiblePanel>
        </Collapsible>
      ) : null}
    </div>
  );
}
