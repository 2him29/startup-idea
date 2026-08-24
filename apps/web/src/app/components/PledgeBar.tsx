import { Check, Users } from "lucide-react";
import { pledgeProgress } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface PledgeBarProps {
  /** Confirmed donors on this request. */
  pledged: number;
  /** Units the request asked for. */
  needed: number;
  /** `compact` is the dense list row; `full` is the request detail. */
  variant?: "full" | "compact";
}

/**
 * Progress toward what the request actually asked for.
 *
 * This replaced a bare "{count} coming so far." The count was true and still
 * answered the wrong question: a donor deciding whether to go wants to know if
 * they are still needed, and two donors means "done" on a one-unit request and
 * "barely started" on a six-unit one. The same sentence read identically in
 * both cases.
 *
 * The bar is the reason this is a component rather than a string: a proportion
 * is read at a glance, which is what someone scrolling a list of requests is
 * doing. The wording stays "pledged" — a confirmed response is a person saying
 * they will come, not a unit collected.
 *
 * No explicit RTL handling. The fill is an ordinary block inside the track, so
 * it grows from whichever side the inherited `dir` starts on.
 */
export function PledgeBar({ pledged, needed, variant = "full" }: PledgeBarProps) {
  const { t } = useI18n();
  const p = pledgeProgress(pledged, needed);
  const compact = variant === "compact";

  // Teal while a request still needs people, green once it does not. Red is
  // the app's colour for the blood itself and for urgency, and a progress bar
  // in it would read as an alarm rather than as progress.
  const fill = p.enough ? "#12B76A" : "#0E8BA8";
  const Icon = p.enough ? Check : Users;

  const label = p.enough
    ? t.enoughPledged
    : t.unitsPledged.replace("{count}", String(p.pledged)).replace("{total}", String(p.needed));

  return (
    <div className={compact ? "mt-1.5" : ""} data-testid="pledge-bar" data-percent={p.percent}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: compact ? 4 : 6, background: "rgba(11,36,50,0.09)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${p.percent}%`, background: fill, transition: "width .3s ease" }}
        />
      </div>
      <div
        className="flex items-center gap-1 mt-1"
        style={{
          fontSize: compact ? "12px" : "12.5px",
          color: p.enough ? "#0E7A4B" : "#5A6B75",
          textAlign: "start",
        }}
      >
        <Icon
          className={compact ? "w-[13px] h-[13px] shrink-0" : "w-4 h-4 shrink-0"}
          strokeWidth={p.enough ? 3 : 2}
        />
        <span style={{ fontWeight: p.enough ? 700 : 400 }}>{label}</span>
      </div>
    </div>
  );
}
