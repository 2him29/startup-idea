interface QatraMarkProps {
  size: number;
  radius: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Brand mark: the Arabic letter ق (qaf) in Cairo on a navy squircle, with a
 * small red drop accent near its dots. Built from the real font glyph rather
 * than the design's source PNG (too large to bring in whole) -- see the
 * "Known gap" note in the build plan.
 */
export function QatraMark({ size, radius, className = "", style }: QatraMarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: radius, background: "#0B2432", overflow: "hidden", ...style }}
    >
      <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: size * 0.52, color: "#fff", lineHeight: 1 }}>
        ق
      </span>
      <svg
        width={size * 0.22}
        height={size * 0.22}
        viewBox="0 0 24 24"
        style={{ position: "absolute", top: size * 0.14, left: "50%", transform: "translateX(-50%)" }}
      >
        <path d="M12 2.5C12 2.5 5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z" fill="#E5484D" />
      </svg>
    </div>
  );
}

/** The قطرة wordmark -- brand names don't translate, so this stays fixed regardless of active language. */
export function QatraWordmark({ size, className = "" }: { size: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: size, color: "#0B2432", direction: "rtl", lineHeight: 1 }}
    >
      قطرة
    </span>
  );
}
