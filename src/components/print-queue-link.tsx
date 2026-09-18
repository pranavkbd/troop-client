"use client";

import { PrinterIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePrintQueue } from "@/lib/print-queue";
import { cn } from "@/lib/utils";

/** Header link to the print queue, badged with the number of people queued. */
export function PrintQueueLink() {
  const { count } = usePrintQueue();
  const active = usePathname().startsWith("/print");

  return (
    <Link
      href="/print"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      aria-label={`Barcodes to print, ${count} queued`}
    >
      <span className="hidden sm:inline">Barcodes</span>
      <PrinterIcon className="h-4 w-4" />
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors",
          count > 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
