import { ArrowLeft, Phone, Clock, MapPin, AlertTriangle } from "lucide-react";
import { urgencyLabel, type BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface RequestDetailProps {
  onBack: () => void;
  onRespond: () => void;
  request: BloodRequest;
}

export function RequestDetail({ onBack, onRespond, request }: RequestDetailProps) {
  const { t, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.requestDetails}</div>
      </div>

      <div
        className="rounded-3xl p-[22px] text-white shadow-[0_22px_40px_-22px_rgba(229,72,77,0.8)]"
        style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[12.5px] opacity-90 font-semibold">{t.requestedBy}</div>
            <div className="text-[21px] font-extrabold tracking-[-0.3px]">{request.hospital}</div>
          </div>
          <span className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-full bg-white/[0.22] border border-white/40">{urgencyLabel(request.urgency, t)}</span>
        </div>
        <div className="mt-5 flex gap-2.5">
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <div className="text-[22px] font-extrabold">{request.bloodType}</div>
            <div className="text-[11px] opacity-90">{t.bloodType}</div>
          </div>
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <div className="text-[22px] font-extrabold">{request.units}</div>
            <div className="text-[11px] opacity-90">{t.unitsNeeded}</div>
          </div>
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <div className="text-[22px] font-extrabold">{request.distance}</div>
            <div className="text-[11px] opacity-90">{t.distance}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div className="text-sm font-extrabold mb-3" style={{ color: "#0B2432", textAlign: "start" }}>{t.details}</div>
        <div className="flex flex-col gap-[13px]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
              <Clock className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>{t.posted} {request.time}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{t.responseWindow}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
              <MapPin className="w-[17px] h-[17px]" style={{ color: "#0E8BA8" }} />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>{request.distance} {t.away}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{t.driveParking}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#FFF3E0" }}>
              <AlertTriangle className="w-[17px] h-[17px]" style={{ color: "#F5871F" }} />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>{t.emergencyPatient}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{t.directMatch}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[18px] flex gap-[11px]">
        <button
          className="cursor-pointer w-14 h-[54px] shrink-0 rounded-2xl border-[1.5px] bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.12)" }}
        >
          <Phone className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
        </button>
        <button
          onClick={onRespond}
          className="cursor-pointer flex-1 h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
          style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
        >
          {t.respondRequest}
        </button>
      </div>
    </div>
  );
}
