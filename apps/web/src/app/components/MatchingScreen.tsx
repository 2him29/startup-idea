import { ArrowLeft, MapPin, Droplet } from "lucide-react";
import { unitsLabel, urgencyStyle, useBloodRequests, type BloodRequest } from "@weare/core";

interface MatchingScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
  onOpenDetail: (request: BloodRequest) => void;
}

export function MatchingScreen({ onBack, userType, onOpenDetail }: MatchingScreenProps) {
  const accent = userType === "hospital" ? "#0E8BA8" : "#E5484D";
  const { requests: bloodRequests } = useBloodRequests();

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432" }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>Urgent requests</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>Sorted by distance · {bloodRequests.length} nearby</div>
        </div>
      </div>

      {/* map preview */}
      <div className="rounded-[22px] overflow-hidden h-[172px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
        <svg width="100%" height="172" viewBox="0 0 348 172" preserveAspectRatio="xMidYMid slice" className="block">
          <rect width="348" height="172" fill="#EAF1F0" />
          <path d="M-10 40 H360 M-10 96 H360 M-10 140 H360" stroke="#DBE6E4" strokeWidth="8" />
          <path d="M70 -10 V182 M180 -10 V182 M270 -10 V182" stroke="#DBE6E4" strokeWidth="8" />
          <path d="M-10 96 H70 V-10" stroke="#C9DAD7" strokeWidth="3" fill="none" />
          <path d="M20 150 C 90 120, 130 110, 180 96 S 280 60, 320 30" stroke="#E5484D" strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
        </svg>
        <div className="absolute" style={{ left: "16%", top: "52%", transform: "translate(-50%,-50%)" }}>
          <span className="block w-4 h-4 rounded-full border-[3px] border-white shadow-md" style={{ background: "#0E8BA8" }} />
        </div>
        <div className="absolute" style={{ left: "50%", top: "52%", transform: "translate(-50%,-100%)" }}>
          <svg width="26" height="30" viewBox="0 0 24 28" fill="none">
            <path d="M12 0C6 0 1 5 1 11c0 8 11 17 11 17s11-9 11-17C23 5 18 0 12 0z" fill="#E5484D" stroke="#fff" strokeWidth="1.6" />
            <circle cx="12" cy="11" r="4" fill="#fff" />
          </svg>
        </div>
        <div className="absolute" style={{ left: "84%", top: "24%", transform: "translate(-50%,-100%)" }}>
          <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
            <path d="M12 0C6 0 1 5 1 11c0 8 11 17 11 17s11-9 11-17C23 5 18 0 12 0z" fill="#F5871F" stroke="#fff" strokeWidth="1.6" />
            <circle cx="12" cy="11" r="4" fill="#fff" />
          </svg>
        </div>
        <div className="absolute top-3 right-3 bg-white rounded-xl px-[11px] py-2 shadow-[0_6px_14px_-8px_rgba(11,36,50,0.5)]">
          <div className="text-xs font-extrabold" style={{ color: accent }}>Live map</div>
          <div className="text-[11px]" style={{ color: "#8496A0" }}>{bloodRequests.length} nearby</div>
        </div>
      </div>

      {/* request list */}
      <div className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {bloodRequests.map((r) => {
          const badge = urgencyStyle[r.urgency];
          return (
            <button
              key={r.id}
              onClick={() => onOpenDetail(r)}
              className="cursor-pointer text-left w-full border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", animation: "waRise .4s ease both" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-[13px]">
                  <span
                    className="w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 shadow-[0_8px_16px_-8px_rgba(229,72,77,0.7)]"
                    style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
                  >
                    <Droplet className="w-6 h-6" fill="white" stroke="none" />
                  </span>
                  <div>
                    <div className="text-[15.5px] font-bold" style={{ color: "#0B2432" }}>{r.hospital}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[12.5px]" style={{ color: "#8496A0" }}>
                      <MapPin className="w-[13px] h-[13px]" />
                      {r.distance} · {r.time}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                  {r.urgency}
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-2.5">
                <span className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units)}</span>
                <span className="ml-auto text-[13px] font-extrabold" style={{ color: accent }}>View →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
