import { BarcodeImage } from "@/components/barcode-image";
import { TroopMark } from "@/components/troop-mark";
import { cn } from "@/lib/utils";

interface BarcodeTagProps {
  name: string;
  value: string;
  className?: string;
}

/**
 * The printable tag: Troop mark, the person's name, and their barcode. Used
 * as the preview on detail pages and as each tile on the print page, so what
 * staff see is exactly what comes out of the printer.
 */
export function BarcodeTag({ name, value, className }: BarcodeTagProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed bg-white p-5 text-black break-inside-avoid print:rounded-none print:border-neutral-400",
        className,
      )}
    >
      <div className="flex w-full items-center text-xs">
        <span className="flex items-center gap-1 font-semibold text-neutral-800">
          <TroopMark className="h-3 w-4" />
          Troop
        </span>
      </div>
      <p className="text-lg font-semibold tracking-tight">{name}</p>
      <BarcodeImage value={value} className="px-0 py-0" />
    </div>
  );
}
