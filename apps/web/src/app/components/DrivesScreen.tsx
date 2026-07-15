import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useBloodDrives, formatDriveDate, wilayaLabel } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface DrivesScreenProps {
  onBack: () => void;
}

export function DrivesScreen({ onBack }: DrivesScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const { drives } = useBloodDrives();

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
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.drivesTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.drivesSub}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {drives.map((d) => (
          <div
            key={d.id}
            className="border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
            style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
          >
            <div className="flex items-start gap-3">
              <span
                className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
                style={{ background: "#E4F6FB" }}
              >
                <Calendar className="w-5 h-5" style={{ color: "#0E8BA8" }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: "#0B2432" }}>{d.title}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: "#8496A0" }}>{d.organizer}</div>
              </div>
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: "#E4F6FB", color: "#0E8BA8" }}
              >
                {wilayaLabel(d.wilaya, lang)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[12.5px]" style={{ color: "#6B7C88" }}>
              <MapPin className="w-[13px] h-[13px] shrink-0" />
              {d.location}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "#0B2432" }}>
              <Calendar className="w-[13px] h-[13px] shrink-0" />
              {formatDriveDate(d.startsAt, lang)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
