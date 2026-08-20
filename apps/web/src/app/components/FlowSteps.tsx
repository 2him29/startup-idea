import { Check } from "lucide-react";
import { useI18n } from "../i18n/LangContext";

export type FlowStep = "request" | "verify" | "posted";

const ORDER: FlowStep[] = ["request", "verify", "posted"];

/**
 * Where you are in posting a request: fill it in, verify the number, done.
 *
 * Shown because this is the one flow in the app that interrupts itself. The
 * form hands off to phone verification part-way through, and without a visible
 * three-step spine that interruption reads as the app losing the work — which
 * is exactly the moment a frightened family gives up and goes back to
 * WhatsApp. Three labelled steps promise the detour is short and finite.
 *
 * Not clickable. A step you have not reached cannot be jumped to, and one you
 * have finished should not be re-entered by accident.
 */
export function FlowSteps({ current }: { current: FlowStep }) {
  const { t, dir } = useI18n();
  const labels: Record<FlowStep, string> = {
    request: t.flowStepRequest,
    verify: t.flowStepVerify,
    posted: t.flowStepPosted,
  };
  const currentIndex = ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
      {ORDER.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1.5 flex-1">
            <div
              className="flex items-center gap-1.5 rounded-full ps-1.5 pe-3 py-1.5 flex-1"
              style={{
                background: active ? "#FFECEC" : done ? "#EAF6EF" : "#F1F5F6",
                border: `1px solid ${active ? "rgba(229,72,77,0.25)" : "transparent"}`,
              }}
            >
              <span
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
                style={{
                  background: active ? "#E5484D" : done ? "#12B76A" : "#DCE4E7",
                  color: active || done ? "#fff" : "#8496A0",
                }}
              >
                {done ? <Check className="w-3 h-3" strokeWidth={3.5} /> : i + 1}
              </span>
              <span
                className="text-[11.5px] font-bold truncate"
                style={{ color: active ? "#B22F35" : done ? "#0E7A4B" : "#8496A0" }}
              >
                {labels[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The draft, described in one line: "Amel K. · O− · 3 units · CHU Mustapha".
 *
 * Its job is on the verification screen — evidence that what was typed still
 * exists. Saying "saved as a draft" without showing any of it asks for trust
 * at the exact moment the app has just interrupted someone.
 *
 * dir is left to the container: the parts are user text and already-formatted
 * labels, and the separator is neutral.
 */
export function draftSummary(parts: (string | number | null | undefined)[]): string {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : p))
    .filter((p) => p !== null && p !== undefined && p !== "")
    .join(" · ");
}
