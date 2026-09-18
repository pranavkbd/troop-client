"use client";

import { useSyncExternalStore } from "react";

import type { BarcodeOwnerKind } from "@/lib/types";

/**
 * The print queue is a cart of *people*, not barcodes. It remembers who to
 * print for, and the print page looks up each person's current barcode at
 * render time, so a replacement issued after queueing prints correctly.
 *
 * It lives in this browser's localStorage: it survives navigation and reloads
 * on the front-desk machine, and is intentionally per device.
 */
export interface PrintQueueItem {
  kind: BarcodeOwnerKind;
  id: string;
}

const STORAGE_KEY = "troop.printQueue";
const EMPTY: PrintQueueItem[] = [];

let snapshot: PrintQueueItem[] | null = null;
const listeners = new Set<() => void>();

function isItem(value: unknown): value is PrintQueueItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === "student" || v.kind === "employee") && typeof v.id === "string"
  );
}

function load(): PrintQueueItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function read(): PrintQueueItem[] {
  if (snapshot === null) snapshot = load();
  return snapshot;
}

function write(items: PrintQueueItem[]) {
  snapshot = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable; the in-memory queue still works for this page.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      snapshot = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const sameItem = (a: PrintQueueItem, b: PrintQueueItem) =>
  a.kind === b.kind && a.id === b.id;

export function usePrintQueue() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    items,
    count: items.length,
    has: (item: PrintQueueItem) => items.some((i) => sameItem(i, item)),
    add: (additions: PrintQueueItem[]) => {
      const current = read();
      const fresh = additions.filter(
        (item) => !current.some((i) => sameItem(i, item)),
      );
      if (fresh.length > 0) write([...current, ...fresh]);
      return fresh.length;
    },
    remove: (item: PrintQueueItem) =>
      write(read().filter((i) => !sameItem(i, item))),
    clear: () => write(EMPTY),
  };
}
