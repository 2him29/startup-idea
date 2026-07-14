import qatraLogo from "../../assets/qatra-logo.png";

interface QatraMarkProps {
  size: number;
  radius: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Brand mark: the real Qatra logo asset (navy squircle, ق glyph, red drop accent). */
export function QatraMark({ size, radius, className = "", style }: QatraMarkProps) {
  return (
    <img
      src={qatraLogo}
      alt="Qatra"
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", ...style }}
    />
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
