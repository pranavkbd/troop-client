import { encodeCode128 } from "@/lib/barcode";
import { cn } from "@/lib/utils";

interface BarcodeImageProps {
  value: string;
  /** Pixels per narrow element. Camera scanners want 3+ on a screen. */
  module?: number;
  /** Bar height in pixels. */
  height?: number;
  className?: string;
  hideLabel?: boolean;
}

/** Code 128 requires at least 10 modules of blank space on each side. */
const QUIET_ZONE_MODULES = 10;

/**
 * Printable, scannable Code 128 barcode. Every dimension is an integer number
 * of device pixels: bars are never stretched, so they render crisp rather than
 * anti-aliased, which is what a handheld imager needs to read a screen.
 */
export function BarcodeImage({
  value,
  module = 3,
  height = 64,
  className,
  hideLabel = false,
}: BarcodeImageProps) {
  const encoded = encodeCode128(value);

  if (!encoded) {
    return (
      <p className={cn("text-sm text-destructive", className)}>
        Can't encode "{value}" as a barcode.
      </p>
    );
  }

  const quiet = QUIET_ZONE_MODULES * module;
  const width = encoded.totalWidth * module + quiet * 2;

  return (
    <figure
      className={cn(
        "inline-flex flex-col items-center gap-1 rounded-md bg-white px-2 py-2 text-black",
        className,
      )}
    >
      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        className="block max-w-full"
      >
        <rect x={0} y={0} width={width} height={height} fill="white" />
        {encoded.bars.map((bar) => (
          <rect
            key={bar.x}
            x={quiet + bar.x * module}
            y={0}
            width={bar.width * module}
            height={height}
            fill="black"
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
