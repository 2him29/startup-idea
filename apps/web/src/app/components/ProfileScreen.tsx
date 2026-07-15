import { ArrowLeft, Droplet, Heart, Award, Calendar, User, Settings, ChevronRight, Download } from "lucide-react";
import { useDonorProfile, computeEligibility, type Profile, type Strings } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface DonationEntry {
  id: number;
  location: string;
  date: string;
  type: string;
  units: number;
}

function downloadCertificate(donorName: string, entry: DonationEntry, t: Strings, dir: "ltr" | "rtl") {
  const win = window.open("", "_blank");
  if (!win) return;
  const body = t.certBody
    .replace("{date}", entry.date)
    .replace("{location}", entry.location)
    .replace("{type}", entry.type)
    .replace("{units}", String(entry.units));
  const reference = `#QC-${String(entry.id).padStart(4, "0")}`;
  win.document.write(`
    <html dir="${dir}">
      <head>
        <title>${t.certTitle}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 60px; color: #0B2432; }
          .card { border: 2px solid #0B2432; border-radius: 16px; padding: 48px; text-align: center; }
          h1 { font-size: 22px; letter-spacing: 0.5px; margin-bottom: 32px; }
          .name { font-size: 28px; font-weight: 800; margin: 16px 0; color: #E5484D; }
          p { font-size: 15px; line-height: 1.7; max-width: 480px; margin: 0 auto; }
          .ref { margin-top: 32px; font-size: 13px; color: #8496A0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>قطرة · ${t.certTitle}</h1>
          <p>${t.certIntro}</p>
          <div class="name">${donorName}</div>
          <p>${body}</p>
          <p style="margin-top:20px;">${t.certThanks}</p>
          <div class="ref">${reference}</div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
  profile: Profile | null;
  onSignOut: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const donationHistory = [
  { id: 1, location: "City General Hospital", date: "Mar 15, 2025", type: "Whole Blood", units: 1 },
  { id: 2, location: "Memorial Medical Center", date: "Dec 10, 2024", type: "Whole Blood", units: 1 },
  { id: 3, location: "St. Mary's Hospital", date: "Sep 5, 2024", type: "Platelets", units: 1 },
];

export function ProfileScreen({ onBack, onNavigate, profile, onSignOut }: ProfileScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const displayName = profile?.fullName ?? "Yacine B.";
  const displayEmail = profile?.email ?? "yacine.b@email.com";
  const { donorProfile } = useDonorProfile();
  const eligibility = computeEligibility(donorProfile?.lastDonationDate ?? null);
  const nextEligibleText = eligibility.nextEligibleDate
    ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(eligibility.nextEligibleDate)
    : t.ready;

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
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.profile}</div>
      </div>

      <div
        className="rounded-3xl p-[22px] text-white flex items-center gap-4 shadow-[0_22px_40px_-22px_rgba(229,72,77,0.75)]"
        style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
      >
        <span
          className="w-[66px] h-[66px] rounded-full bg-white flex items-center justify-center text-2xl font-extrabold border-4 shrink-0"
          style={{ color: "#E5484D", borderColor: "rgba(255,255,255,0.35)" }}
        >
          {initials(displayName)}
        </span>
        <div className="flex-1">
          <div className="text-xl font-extrabold">{displayName}</div>
          <div className="text-[13px] opacity-90">{displayEmail}</div>
          <span className="inline-block mt-2 text-xs font-extrabold bg-white/[0.22] border border-white/35 px-[11px] py-1 rounded-full">
            {t.bloodType} {donorProfile?.bloodType ?? "A+"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[11px] mt-4">
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Droplet className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#E5484D" }} fill="#E5484D" />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>12</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>{t.donations}</div>
        </div>
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Heart className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#E5484D" }} fill="#E5484D" />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>36</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>{t.livesSaved}</div>
        </div>
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Award className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#F5871F" }} />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>3</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>Badges</div>
        </div>
      </div>

      <div
        className="mt-4 rounded-2xl p-[18px] text-white flex items-center gap-[14px]"
        style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
      >
        <span className="w-[46px] h-[46px] rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Calendar className="w-[22px] h-[22px]" />
        </span>
        <div className="flex-1">
          <div className="text-[12.5px] opacity-90">{t.nextEligible}</div>
          <div className="text-[17px] font-extrabold">{nextEligibleText}</div>
        </div>
        <span className="text-xs font-extrabold bg-white/[0.22] px-[11px] py-1.5 rounded-full">
          {eligibility.eligible ? t.ready : `${eligibility.daysLeft} ${t.daysLeft}`}
        </span>
      </div>

      <div className="mt-5 text-[15px] font-extrabold mb-[11px]" style={{ color: "#0B2432" }}>{t.history}</div>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        {donationHistory.map((h, i) => (
          <div
            key={h.id}
            className="flex items-center gap-[13px] px-[15px] py-3.5"
            style={i < donationHistory.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
          >
            <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
              <Droplet className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} fill="#E5484D" />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{h.location}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{h.date} · {h.type}</div>
            </div>
            <span className="text-xs font-bold" style={{ color: "#6B7C88" }}>{h.units}u</span>
            <button
              onClick={() => downloadCertificate(displayName, h, t, dir)}
              title={t.downloadCertificate}
              className="cursor-pointer w-8 h-8 rounded-lg border-none bg-transparent flex items-center justify-center shrink-0"
              style={{ color: "#8496A0" }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-0.5">
        <button onClick={() => onNavigate("edit-profile")} className="cursor-pointer w-full text-start border-none bg-transparent py-[15px] px-1 flex items-center gap-[13px]">
          <User className="w-5 h-5" style={{ color: "#E5484D" }} />
          <span className="flex-1 text-[15px] font-semibold" style={{ color: "#0B2432" }}>{t.editProfile}</span>
          <ChevronRight className="w-[18px] h-[18px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
        </button>
        <button onClick={() => onNavigate("settings")} className="cursor-pointer w-full text-start border-none bg-transparent py-[15px] px-1 flex items-center gap-[13px]">
          <Settings className="w-5 h-5" style={{ color: "#E5484D" }} />
          <span className="flex-1 text-[15px] font-semibold" style={{ color: "#0B2432" }}>{t.settingsLabel}</span>
          <ChevronRight className="w-[18px] h-[18px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
        </button>
        <button
          onClick={onSignOut}
          className="cursor-pointer w-full text-start border-none bg-transparent py-[15px] px-1 text-[15px] font-bold"
          style={{ color: "#E5484D" }}
        >
          {t.signOut}
        </button>
      </div>
    </div>
  );
}
