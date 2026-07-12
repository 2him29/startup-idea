import { Check, Navigation } from "lucide-react";
import type { BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface MatchConfirmProps {
  onBackHome: () => void;
  request: BloodRequest;
}

export function MatchConfirm({ onBackHome, request }: MatchConfirmProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-[730px] flex flex-col items-center justify-center text-center px-[30px] py-[30px]">
      <div
        className="w-[104px] h-[104px] rounded-full flex items-center justify-center shadow-[0_22px_44px_-16px_rgba(18,183,106,0.7)]"
        style={{ background: "linear-gradient(135deg,#12B76A,#0E9F6E)", animation: "waPop .5s ease both" }}
      >
        <Check className="w-[52px] h-[52px]" style={{ color: "white" }} strokeWidth={2.6} />
      </div>
      <h2 className="mt-[26px] text-[26px] font-extrabold tracking-[-0.5px]" style={{ color: "#0B2432" }}>
        {t.matchedTitle}
      </h2>
      <p className="mt-[10px] text-[15px] leading-relaxed max-w-[270px]" style={{ color: "#5A6B75" }}>
        {t.matchedBody}
      </p>

      <div className="mt-[26px] w-full bg-white border rounded-[20px] p-[18px] text-start shadow-[0_12px_26px_-20px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div className="flex justify-between py-[9px]">
          <span className="text-[13.5px]" style={{ color: "#8496A0" }}>{t.location}</span>
          <span className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{request.hospital}</span>
        </div>
        <div className="h-px" style={{ background: "rgba(11,36,50,0.06)" }} />
        <div className="flex justify-between py-[9px]">
          <span className="text-[13.5px]" style={{ color: "#8496A0" }}>{t.distance}</span>
          <span className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{request.distance}</span>
        </div>
        <div className="h-px" style={{ background: "rgba(11,36,50,0.06)" }} />
        <div className="flex justify-between py-[9px]">
          <span className="text-[13.5px]" style={{ color: "#8496A0" }}>{t.confirmation}</span>
          <span className="text-[13.5px] font-bold" style={{ color: "#12B76A" }}>#WA-4821</span>
        </div>
      </div>

      <div className="mt-[22px] w-full flex flex-col gap-[11px]">
        <button
          className="cursor-pointer w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
        >
          <Navigation className="w-[19px] h-[19px]" />
          {t.getDirections}
        </button>
        <button
          onClick={onBackHome}
          className="cursor-pointer w-full h-[52px] rounded-2xl border-[1.5px] bg-white text-[15px] font-extrabold"
          style={{ borderColor: "rgba(11,36,50,0.12)", color: "#0B2432" }}
        >
          {t.backHome}
        </button>
      </div>
    </div>
  );
}
