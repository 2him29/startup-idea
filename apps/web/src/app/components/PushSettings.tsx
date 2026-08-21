import { useEffect, useState } from "react";
import { Bell, BellOff, Check, Info } from "lucide-react";
import { disablePush, enablePush, errorMessage, pushState, type PushState } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

/**
 * Turning notifications on, per browser.
 *
 * "Per browser" is the part worth being explicit about: a subscription belongs
 * to one browser on one device, so a donor with a phone and a laptop has to
 * enable each. Saying so prevents the reasonable assumption that this is an
 * account setting, and the silence that follows when the other device never
 * rings.
 *
 * The four states get four different messages rather than one button that
 * sometimes does nothing. "blocked" in particular has to explain that the app
 * cannot ask again — the browser will not show the prompt a second time, and
 * only the user can undo it in site settings.
 */
export function PushSettings() {
  const { t } = useI18n();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => pushState().then(setState).catch(() => setState("unsupported"));
  useEffect(() => {
    refresh();
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      // The worker sits at the app's base, which is not the domain root on
      // GitHub Pages.
      await enablePush(`${import.meta.env.BASE_URL}sw.js`);
    } catch (err) {
      setError(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disablePush();
    } catch (err) {
      setError(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  if (state === null) return null;

  return (
    <div className="bg-white border rounded-[20px] p-[18px] mb-4" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: state === "on" ? "#EAF6EF" : "#FFECEC" }}>
          {state === "on"
            ? <Bell className="w-[17px] h-[17px]" style={{ color: "#12B76A" }} />
            : <BellOff className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} />}
        </span>
        <div className="flex-1" style={{ textAlign: "start" }}>
          <div className="text-[14.5px] font-extrabold" style={{ color: "#0B2432" }}>{t.pushTitle}</div>
          {/* What will be sent, before asking for permission. A prompt with no
              stated scope is the reason people refuse them. */}
          <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "#8496A0" }}>{t.pushWhat}</div>
        </div>
      </div>

      {state === "idle" && (
        <button
          onClick={handleEnable}
          disabled={busy}
          data-testid="push-enable"
          className="cursor-pointer disabled:opacity-60 mt-3.5 w-full h-[46px] rounded-2xl text-white text-[14px] font-extrabold border-none"
          style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
        >
          {busy ? t.pushEnabling : t.pushEnable}
        </button>
      )}

      {state === "on" && (
        <>
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: "#EAF6EF" }}>
            <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#12B76A" }} strokeWidth={3} />
            <span className="text-[12.5px]" style={{ color: "#0E7A4B", textAlign: "start" }}>{t.pushOn}</span>
          </div>
          <button
            onClick={handleDisable}
            disabled={busy}
            data-testid="push-disable"
            className="cursor-pointer disabled:opacity-60 mt-2.5 w-full h-[44px] rounded-2xl text-[13.5px] font-bold bg-white border-[1.5px]"
            style={{ borderColor: "rgba(11,36,50,0.12)", color: "#5A6B75" }}
          >
            {t.pushDisable}
          </button>
        </>
      )}

      {(state === "blocked" || state === "unsupported") && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: "#F7FAFB" }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8496A0" }} />
          <span className="text-[12.5px] leading-relaxed" style={{ color: "#5A6B75", textAlign: "start" }}>
            {state === "blocked" ? t.pushBlocked : t.pushUnsupported}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-2xl px-3.5 py-3 text-[12.5px]" style={{ background: "#FFECEC", color: "#8A3438", textAlign: "start" }}>
          {error}
        </div>
      )}
    </div>
  );
}
