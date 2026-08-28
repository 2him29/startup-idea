import { ArrowLeft, Droplet, Calendar, User, Settings, ChevronRight } from "lucide-react";
import { useDonorProfile, computeEligibility, useResponses, formatRelativeTime, type Profile } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useCountUp } from "../useCountUp";
import { SCREEN_BG } from "../background";

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

export function ProfileScreen({ onBack, onNavigate, profile, onSignOut }: ProfileScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const displayName = profile?.fullName ?? "Yacine B.";
  const displayEmail = profile?.email ?? "yacine.b@email.com";
  const { donorProfile } = useDonorProfile();
  // No request ids: this screen wants the donor's own responses, which
  // fetchMyResponses returns regardless, not per-request counts.
  const { goingTo } = useResponses([]);
  const answered = useCountUp(goingTo.size);
  const eligibility = computeEligibility(donorProfile?.lastDonationDate ?? null);
  const nextEligibleText = eligibility.nextEligibleDate
    ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(eligibility.nextEligibleDate)
    : t.ready;

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
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

      {/* One number, counted rather than chosen: rows this donor actually
          wrote. What stood here — twelve donations, thirty-six lives saved,
          three badges — were literals shown identically to everyone, including
          a donor who had never given blood, and "Badges" was never translated
          at all. No donation history exists to make any of them real. */}
      <div className="mt-4 bg-white border rounded-2xl p-4 flex items-center gap-[13px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
          <Droplet className="w-5 h-5" style={{ color: "#E5484D" }} fill="#E5484D" />
        </span>
        <div className="flex-1" style={{ textAlign: "start" }}>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{answered}</div>
          <div className="text-[11.5px] font-semibold" style={{ color: "#8496A0" }}>{t.responsesGiven}</div>
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
        {/*
          One row at most, because one date is all that is recorded.
          donor_profiles keeps last_donation_at and nothing else — no place, no
          component, no count — so the three-entry list that used to sit here
          was invented, down to hospitals in a country this app does not serve.
          The date is real, so it is what is shown; the certificate button went
          with the rows it was certifying, since a certificate needs the
          details that are missing and inventing them would be worse than not
          issuing one.
        */}
        {donorProfile?.lastDonationDate ? (
          <div className="flex items-center gap-[13px] px-[15px] py-3.5">
            <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
              <Droplet className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} fill="#E5484D" />
            </span>
            <div className="flex-1" style={{ textAlign: "start" }}>
              <div className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{t.lastDonationLabel}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{formatRelativeTime(donorProfile.lastDonationDate, lang)}</div>
            </div>
          </div>
        ) : (
          <div className="px-[15px] py-4 text-[13px]" style={{ color: "#8496A0", textAlign: "start" }}>{t.historyEmpty}</div>
        )}
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
