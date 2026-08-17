import { BadgeCheck } from "lucide-react";
import { useI18n } from "../i18n/LangContext";

interface VerifiedBadgeProps {
  /** Association name, or null when nobody has vouched for the request. */
  associationName: string | null;
  /** `full` names the association; `compact` is the chip for dense list rows. */
  variant?: "full" | "compact";
}

/**
 * "Verified by <association>" on a request.
 *
 * Renders nothing when unverified rather than showing a grey "unverified"
 * marker: most requests in a wilaya with no active committee will never be
 * verified, and stamping them all as suspect would push families toward the
 * WhatsApp chains this app exists to replace. The badge is a bonus signal, not
 * a gate.
 */
export function VerifiedBadge({ associationName, variant = "full" }: VerifiedBadgeProps) {
  const { t } = useI18n();
  if (!associationName) return null;

  const label =
    variant === "compact"
      ? t.verifiedShort
      : t.verifiedByLabel.replace("{association}", associationName);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-extrabold"
      style={{
        background: "#EAF6EF",
        color: "#0E7A4B",
        border: "1px solid rgba(18,183,106,0.28)",
        padding: variant === "compact" ? "3px 9px" : "5px 11px",
        fontSize: variant === "compact" ? "10.5px" : "12px",
        textAlign: "start",
      }}
    >
      <BadgeCheck className={variant === "compact" ? "w-3 h-3 shrink-0" : "w-[15px] h-[15px] shrink-0"} strokeWidth={2.6} />
      {label}
    </span>
  );
}
