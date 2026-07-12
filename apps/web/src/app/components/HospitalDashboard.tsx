import { useState } from "react";
import { ArrowLeft, Search, Droplet, Plus } from "lucide-react";
import { unitsLabel, urgencyStyle, urgencyLabel, useBloodRequests } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface HospitalDashboardProps {
  onBack: () => void;
}

export function HospitalDashboard({ onBack }: HospitalDashboardProps) {
  const { t, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const filterChips = [t.filterAll, t.urgencyCritical, "O-", t.filterNearby];

  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState(t.filterAll);
  const { requests: bloodRequests } = useBloodRequests();

  const filtered = bloodRequests.filter((r) => {
    const matchesSearch =
      r.patientId.toLowerCase().includes(search.toLowerCase()) ||
      r.hospital.toLowerCase().includes(search.toLowerCase());
    const matchesChip =
      activeChip === t.filterAll ||
      (activeChip === t.urgencyCritical && r.urgency === "Critical") ||
      (activeChip === "O-" && r.bloodType === "O-") ||
      activeChip === t.filterNearby;
    return matchesSearch && matchesChip;
  });

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px] relative" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.bloodRequestsTitle}</div>
      </div>

      <div className="relative mb-3.5">
        <Search className="absolute start-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "#9AA9B2" }} />
        <input
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 rounded-2xl border-[1.5px] bg-white ps-[42px] pe-3.5 text-sm outline-none"
          style={{ borderColor: "rgba(11,36,50,0.1)", color: "#0B2432" }}
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filterChips.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className="cursor-pointer text-[12.5px] font-bold px-3.5 py-2 rounded-full border"
            style={
              activeChip === chip
                ? { background: "#0E8BA8", color: "#fff", borderColor: "#0E8BA8" }
                : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }
            }
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {filtered.map((r) => {
          const badge = urgencyStyle[r.urgency];
          return (
            <div
              key={r.id}
              className="border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
              style={{ borderColor: "rgba(11,36,50,0.06)" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: "#E4F6FB" }}>
                    <Droplet className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} fill="#0E8BA8" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold" style={{ color: "#0B2432" }}>{r.patientId}</div>
                    <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{r.hospital}</div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>
              <div className="mt-[13px] flex items-center gap-2.5">
                <span className="font-extrabold text-[13px] px-[11px] py-1.5 rounded-[11px]" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
                <span className="text-[12.5px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t)}</span>
                <span className="ms-auto text-[12.5px]" style={{ color: "#8496A0" }}>{r.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="cursor-pointer absolute bottom-[104px] end-5 h-[52px] px-5 rounded-[26px] text-white text-[15px] font-extrabold flex items-center gap-2 shadow-[0_16px_30px_-12px_rgba(14,139,168,0.9)] z-20"
        style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
      >
        <Plus className="w-[19px] h-[19px]" strokeWidth={2.4} />
        {t.newLabel}
      </button>
    </div>
  );
}
