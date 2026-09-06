import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  threshold?: number;
  /**
   * Grace period before the hold animation/timer starts, so a fast
   * double-click (two quick presses) never flashes the hold animation.
   */
  doubleClickGrace?: number;
  disabled?: boolean;
}

export function useLongPress({
  onLongPress,
  threshold = 1500,
  doubleClickGrace = 300,
  disabled = false,
}: UseLongPressOptions) {
  const [isPressing, setIsPressing] = useState(false);
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const start = useCallback(() => {
    if (disabled || graceTimeoutRef.current || holdTimeoutRef.current) return;
    graceTimeoutRef.current = setTimeout(() => {
      graceTimeoutRef.current = null;
      setIsPressing(true);
      holdTimeoutRef.current = setTimeout(() => {
        holdTimeoutRef.current = null;
        setIsPressing(false);
        onLongPress();
      }, threshold);
    }, doubleClickGrace);
  }, [disabled, onLongPress, threshold, doubleClickGrace]);

  return {
    isPressing,
    threshold,
    handlers: {
      onPointerDown: start,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
