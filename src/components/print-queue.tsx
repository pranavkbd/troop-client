"use client";

import { PrinterIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";

import { BarcodeTag } from "@/components/barcode-tag";
import { Button } from "@/components/ui/button";
import { type PrintQueueItem, usePrintQueue } from "@/lib/print-queue";
import type { BarcodeOwnerKind } from "@/lib/types";

/** Everything the queue needs to know about one person, resolved server-side. */
export interface PrintablePerson {
  kind: BarcodeOwnerKind;
  id: string;
  name: string;
  /** Current active barcode value; undefined only if data is inconsistent. */
  barcode?: string;
}

interface PrintQueueProps {
  people: PrintablePerson[];
}

export function PrintQueue({ people }: PrintQueueProps) {
  const queue = usePrintQueue();
  const byKey = new Map(people.map((p) => [`${p.kind}:${p.id}`, p]));

  const tiles = queue.items.flatMap((item) => {
    const person = byKey.get(`${item.kind}:${item.id}`);
    return person?.barcode ? [{ item, person, barcode: person.barcode }] : [];
  });
  const missing = queue.items.length - tiles.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Print queue</h1>
          <p className="text-muted-foreground text-sm">
            {tiles.length === 0
              ? "Nothing queued yet."
              : `${tiles.length} barcode${tiles.length === 1 ? "" : "s"} ready to print, one tag per person. Letter or A4, portrait; cut along the borders.`}
            {missing > 0
              ? ` ${missing} queued ${missing === 1 ? "entry" : "entries"} no longer match a person and will be skipped.`
              : ""}
          </p>
        </div>
        {tiles.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={queue.clear}>
              <Trash2Icon />
              Clear queue
            </Button>
            <Button onClick={() => window.print()}>
              <PrinterIcon />
              Print {tiles.length}
            </Button>
          </div>
        ) : null}
      </div>

      {tiles.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center text-sm">
          <PrinterIcon className="h-8 w-8" />
          <p>
            Add barcodes from a{" "}
            <Link href="/students" className="underline underline-offset-4">
              student
            </Link>{" "}
            or{" "}
            <Link href="/employees" className="underline underline-offset-4">
              employee
            </Link>{" "}
            page, or select several rows in those lists.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
          {tiles.map(({ item, person, barcode }) => (
            <div key={`${item.kind}:${item.id}`} className="relative">
              <BarcodeTag name={person.name} value={barcode} />
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-2 right-2 print:hidden"
                onClick={() => queue.remove(item)}
                aria-label={`Remove ${person.name} from the print queue`}
              >
                <XIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { PrintQueueItem };
