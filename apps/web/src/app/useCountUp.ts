import { useEffect, useState } from "react";

/** Animate a number from 0 to `target` once on mount (ease-out, ~0.9s). */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
    }

    /*
     * The stylesheet's prefers-reduced-motion rule cannot reach this.
     * It flattens CSS animations and transitions; this is a
     * requestAnimationFrame loop, so someone who asked for less motion would
     * still get a number ticking upward at them. Ask directly and skip to the
     * answer.
     */
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
