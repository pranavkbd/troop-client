import { encodeCode39 } from "@/lib/barcode";
import { cn } from "@/lib/utils";

interface BarcodeProps {
  value: string;
  /** Rendered bar height in pixels. */
  height?: number;
  className?: string;
  /** Hide the human-readable text under the bars. */
  hideLabel?: boolean;
}

/**
 * Printable Code 39 barcode. Bars are laid out in narrow-module units and the
 * SVG stretches to its container's width, which keeps the wide/narrow ratio
 * intact at any size.
 */
export function Barcode({
  value,
  height = 56,
  className,
  hideLabel = false,
}: BarcodeProps) {
  const encoded = encodeCode39(value);

  if (!encoded) {
    return (
      <p className={cn("text-sm text-destructive", className)}>
        Can't encode "{value}" as a barcode.
      </p>
    );
  }

  return (
    <figure
      className={cn(
        "inline-flex flex-col items-center gap-1 rounded-md bg-white px-4 py-3 text-black",
        className,
      )}
    >
      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        viewBox={`0 0 ${encoded.totalWidth} ${height}`}
        width={encoded.totalWidth * 2}
        height={height}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="max-w-full"
      >
        {encoded.bars.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill="currentColor"
          />
        ))}
      </svg>
      {hideLabel ? null : (
        <figcaption className="font-mono text-sm tracking-[0.3em]">
          {value}
        </figcaption>
      )}
    </figure>
  );
}
