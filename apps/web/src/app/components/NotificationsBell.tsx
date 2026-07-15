import { useEffect, useRef, useState } from "react";
import { Bell, Droplet, CheckCircle2 } from "lucide-react";
import { urgencyStyle, urgencyLabel, type BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface NotificationsBellProps {
  requests: BloodRequest[];
  /** Called with the tapped request; the host screen decides where to route. */
  onOpen: (request: BloodRequest) => void;
  size?: number;
}

/**
 * Header bell backed by real data: open Critical/High requests appear as
 * notifications, and the red dot only shows when something urgent exists.
 */
export function NotificationsBell({ requests, onOpen, size = 44 }: NotificationsBellProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const urgent = requests.filter((r) => r.urgency === "Critical" || r.urgency === "High").slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.notifications}
        className="cursor-pointer relative rounded-[14px] border bg-white flex items-center justify-center shadow-[0_6px_14px_-8px_rgba(11,36,50,0.3)]"
        style={{ width: size, height: size, borderColor: "rgba(11,36,50,0.08)" }}
      >
        <Bell className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
        {urgent.length > 0 && (
          <span className="absolute top-[9px] end-[10px] w-[9px] h-[9px] rounded-full bg-[#E5484D] border-2 border-white" />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 w-[310px] bg-white border rounded-[18px] overflow-hidden z-[70] shadow-[0_24px_48px_-16px_rgba(11,36,50,0.45)]"
          style={{ insetInlineEnd: 0, borderColor: "rgba(11,36,50,0.08)", animation: "waPanel .22s ease both" }}
        >
          <div className="px-4 py-3 text-[13.5px] font-extrabold" style={{ color: "#0B2432", borderBottom: "1px solid rgba(11,36,50,0.06)", textAlign: "start" }}>
            {t.notifications}
          </div>
          {urgent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-7 px-4">
              <CheckCircle2 className="w-7 h-7" style={{ color: "#12B76A" }} />
              <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{t.noNotifications}</span>
            </div>
          ) : (
            urgent.map((r, i) => {
              const badge = urgencyStyle[r.urgency];
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setOpen(false);
                    onOpen(r);
                  }}
                  className="cursor-pointer w-full border-none bg-transparent flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: i < urgent.length - 1 ? "1px solid rgba(11,36,50,0.05)" : "none",
                    textAlign: "start",
                  }}
                >
                  <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
                    <Droplet className="w-4 h-4" fill="#E5484D" stroke="none" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold truncate" style={{ color: "#0B2432" }}>
                      {r.bloodType} · {r.hospital}
                    </span>
                    <span className="block text-[11.5px]" style={{ color: "#8496A0" }}>{r.time}</span>
                  </span>
                  <span className="text-[10.5px] font-extrabold px-2 py-1 rounded-full shrink-0" style={{ background: badge.bg, color: badge.fg }}>
                    {urgencyLabel(r.urgency, t)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
