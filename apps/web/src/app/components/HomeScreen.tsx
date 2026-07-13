import { useState } from "react";
import { Droplet, Users, Bell, ShieldCheck, ChevronRight, Calendar, Award, PlayCircle, Moon, HeartHandshake, Flame } from "lucide-react";
import { RESERVE, RESERVE_STATUS } from "@weare/core";
import { QatraMark, QatraWordmark } from "./QatraMark";
import { LangSwitcher } from "./LangSwitcher";
import { useI18n } from "../i18n/LangContext";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
  onSetUserType: (type: "donor" | "hospital") => void;
  onDemoLogin: (role: "donor" | "hospital") => Promise<void>;
}

export function HomeScreen({ onNavigate, userType, onSetUserType, onDemoLogin }: HomeScreenProps) {
  const { t, lang, dir } = useI18n();
  const [demoLoading, setDemoLoading] = useState<"donor" | "hospital" | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [ramadanMode] = useState(true);

  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const handleDemo = async (role: "donor" | "hospital") => {
    setDemoError(null);
    setDemoLoading(role);
    try {
      await onDemoLogin(role);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Couldn't start the demo, try again");
    } finally {
      setDemoLoading(null);
    }
  };

  if (!userType) {
    return (
      <div
        className="flex flex-col min-h-screen p-6 pb-8 md:p-12"
        style={{ background: "radial-gradient(130% 90% at 50% -10%, #FFE1E0 0%, #FFF3F2 40%, #F4FBFC 100%)" }}
      >
        <div className="flex justify-center md:justify-end">
          <LangSwitcher />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <QatraMark
            size={98}
            radius={28}
            className="md:hidden shadow-[0_20px_44px_-16px_rgba(11,36,50,0.5)]"
            style={{ animation: "waPop .5s ease both" }}
          />
          <QatraMark
            size={130}
            radius={36}
            className="hidden md:flex shadow-[0_20px_44px_-16px_rgba(11,36,50,0.5)]"
            style={{ animation: "waPop .5s ease both" }}
          />
          <QatraWordmark size={50} className="mt-5 md:mt-6" />
          <div className="mt-0.5 text-[13px] font-extrabold tracking-[4px] uppercase" style={{ color: "#E5484D" }}>Qatra</div>
          <p className="mt-[10px] md:mt-3 text-base md:text-xl leading-relaxed max-w-[270px] md:max-w-md" style={{ color: "#5A6B75" }}>
            {t.tagline}
          </p>

          <div className="w-full md:w-full md:max-w-4xl mt-[34px] md:mt-14 flex flex-col md:flex-row gap-3.5 md:gap-5">
            <button
              onClick={() => onSetUserType("donor")}
              className="cursor-pointer text-left p-5 md:p-7 rounded-[24px] md:rounded-[28px] text-white flex items-center gap-4 md:gap-5 shadow-[0_20px_34px_-16px_rgba(229,72,77,0.7)] md:flex-1 md:min-w-0"
              style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)", textAlign: "start" }}
            >
              <span className="w-[52px] h-[52px] md:w-16 md:h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Droplet className="w-[26px] h-[26px] md:w-8 md:h-8" fill="white" />
              </span>
              <span className="flex-1">
                <span className="block text-lg md:text-2xl font-bold">{t.imDonor}</span>
                <span className="block text-[13.5px] md:text-base opacity-90 mt-0.5">{t.donorSub}</span>
              </span>
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 shrink-0" style={{ transform: chevronFlip }} />
            </button>

            <button
              onClick={() => onSetUserType("hospital")}
              className="cursor-pointer text-left p-5 md:p-7 rounded-[24px] md:rounded-[28px] bg-white flex items-center gap-4 md:gap-5 shadow-[0_16px_30px_-18px_rgba(14,139,168,0.55)] border-[1.5px] md:flex-1 md:min-w-0"
              style={{ color: "#0B2432", borderColor: "#DDEFF3", textAlign: "start" }}
            >
              <span className="w-[52px] h-[52px] md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Users className="w-[26px] h-[26px] md:w-8 md:h-8" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-lg md:text-2xl font-bold">{t.imHospital}</span>
                <span className="block text-[13.5px] md:text-base mt-0.5" style={{ color: "#6B7C88" }}>{t.hospitalSub}</span>
              </span>
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 shrink-0" style={{ color: "#0E8BA8", transform: chevronFlip }} />
            </button>
          </div>

          <div className="w-full md:w-full md:max-w-4xl mt-6 md:mt-8">
            <div className="flex items-center gap-3 text-[12px] md:text-[13px] font-semibold" style={{ color: "#9AA9B2" }}>
              <div className="flex-1 h-px" style={{ background: "rgba(11,36,50,0.1)" }} />
              {t.forDemos}
              <div className="flex-1 h-px" style={{ background: "rgba(11,36,50,0.1)" }} />
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-2.5 md:gap-3">
              <button
                type="button"
                onClick={() => handleDemo("donor")}
                disabled={demoLoading !== null}
                className="cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-[13.5px] md:text-sm font-bold px-4 py-3 md:flex-1 rounded-2xl border-[1.5px]"
                style={{ color: "#E5484D", borderColor: "#FBD3D3", background: "#FFF" }}
              >
                <PlayCircle className="w-4 h-4" />
                {demoLoading === "donor" ? "…" : lang === "fr" ? "Démo en tant que donneur" : lang === "ar" ? "عرض تجريبي كمتبرع" : "View demo as Donor"}
              </button>
              <button
                type="button"
                onClick={() => handleDemo("hospital")}
                disabled={demoLoading !== null}
                className="cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-[13.5px] md:text-sm font-bold px-4 py-3 md:flex-1 rounded-2xl border-[1.5px]"
                style={{ color: "#0E8BA8", borderColor: "#CDEAF2", background: "#FFF" }}
              >
                <PlayCircle className="w-4 h-4" />
                {demoLoading === "hospital" ? "…" : lang === "fr" ? "Démo en tant qu'hôpital" : lang === "ar" ? "عرض تجريبي كمستشفى" : "View demo as Hospital"}
              </button>
            </div>
            {demoError && (
              <div className="mt-3 text-[12.5px] font-semibold text-center" style={{ color: "#E5484D" }}>
                {demoError}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-[12.5px] md:text-sm font-semibold" style={{ color: "#8496A0" }}>
          <ShieldCheck className="w-[15px] h-[15px] md:w-4 md:h-4" style={{ color: "#12B76A" }} />
          {t.trust}
        </div>
      </div>
    );
  }

  const isDonor = userType === "donor";

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      {/* header */}
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex items-center gap-2.5">
          <QatraMark size={34} radius={11} />
          <QatraWordmark size={24} />
        </div>
        <div className="flex items-center gap-2.5">
          <LangSwitcher className="md:hidden" />
          <button className="relative w-11 h-11 rounded-[14px] border bg-white flex items-center justify-center shadow-[0_6px_14px_-8px_rgba(11,36,50,0.3)] shrink-0" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
            <Bell className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
            <span className="absolute top-[9px] end-[10px] w-[9px] h-[9px] rounded-full bg-[#E5484D] border-2 border-white" />
          </button>
        </div>
      </div>

      {isDonor ? (
        <div>
          {/* eligibility ring hero */}
          <div
            className="rounded-[26px] p-[22px] text-white relative overflow-hidden shadow-[0_22px_40px_-20px_rgba(229,72,77,0.8)]"
            style={{ background: "linear-gradient(135deg,#E5484D 0%, #F4677E 100%)" }}
          >
            <div className="flex items-center gap-[18px]">
              <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
                  <circle
                    cx="48" cy="48" r="42" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray="264" strokeDashoffset="20" style={{ animation: "waDash 1s ease both" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold leading-none">A+</span>
                  <span className="text-[10px] opacity-90 mt-0.5">{t.eligible}</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[13px] opacity-90 font-semibold">{t.welcome},</span>
                <div className="text-[22px] font-extrabold tracking-[-0.4px]">Yacine B.</div>
                <div className="mt-2.5 inline-flex items-center gap-[7px] bg-white/[0.18] px-3 py-1.5 rounded-xl">
                  <span className="w-[9px] h-[9px] rounded-full bg-[#7BE3A6] shadow-[0_0_0_4px_rgba(123,227,166,0.3)]" />
                  <span className="text-[12.5px] font-bold">{t.eligibleNow}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ramadan night-donation mode */}
          {ramadanMode && (
            <div
              className="mt-3.5 rounded-[20px] px-[17px] py-[15px] text-white flex items-center gap-[13px] relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#3A2A6B,#5B3FA0)" }}
            >
              <Moon className="absolute opacity-20" style={{ width: 90, height: 90, insetInlineEnd: -10, top: -14 }} fill="white" stroke="none" />
              <span className="w-[42px] h-[42px] rounded-xl bg-white/[0.18] flex items-center justify-center shrink-0">
                <Moon className="w-[22px] h-[22px]" />
              </span>
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">{t.ramadanTitle}</div>
                <div className="text-xs opacity-90 mt-px">{t.ramadanSub}</div>
              </div>
            </div>
          )}

          {/* stats */}
          <div className="grid grid-cols-3 gap-[11px] mt-3.5">
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#E5484D" }}>12</div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>{t.donations}</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#E5484D" }}>36</div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>{t.livesSaved}</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold flex items-center justify-center gap-1" style={{ color: "#F5871F" }}>
                <Flame className="w-4 h-4" fill="#F5871F" />6
              </div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>{t.streak}</div>
            </div>
          </div>

          {/* SOS broadcast */}
          <button
            onClick={() => onNavigate("matching")}
            className="cursor-pointer text-left w-full mt-3.5 rounded-[20px] px-[18px] py-4 text-white flex items-center gap-[14px]"
            style={{ background: "linear-gradient(135deg,#2B1416,#3a1a1d)", animation: "waPulse 2.4s infinite", textAlign: "start" }}
          >
            <span className="w-[42px] h-[42px] rounded-xl bg-[#E5484D] flex items-center justify-center shrink-0">
              <Droplet className="w-[22px] h-[22px]" fill="white" stroke="none" />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-extrabold tracking-[1px]" style={{ color: "#F4677E" }}>{t.sosLabel}</span>
              <span className="block text-[15px] font-bold mt-px">{t.sosTitle}</span>
              <span className="block text-xs opacity-85 mt-px">CHU Mustapha · 2.3 km · 2 {t.units}</span>
            </span>
            <span className="text-xs font-extrabold bg-[#E5484D] px-[11px] py-1.5 rounded-full">{t.respond}</span>
          </button>

          {/* national reserve */}
          <div className="mt-[22px] flex items-center justify-between">
            <span className="text-base font-extrabold" style={{ color: "#0B2432" }}>{t.reserveTitle}</span>
            <span className="text-xs font-bold" style={{ color: "#8496A0" }}>Alger · {t.updatedNow}</span>
          </div>
          <div className="mt-3 bg-white border rounded-[20px] p-4 shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <div className="flex flex-col gap-[13px]">
              {RESERVE.map((b) => (
                <div key={b.type} className="flex items-center gap-3">
                  <span className="w-[42px] text-sm font-extrabold" style={{ color: "#0B2432" }}>{b.type}</span>
                  <div className="flex-1 h-[9px] rounded-md overflow-hidden" style={{ background: "#EEF2F4" }}>
                    <div className="h-full rounded-md" style={{ width: b.width, background: b.color }} />
                  </div>
                  <span className="text-[11.5px] font-bold" style={{ color: b.color, width: 66, textAlign: "end" }}>
                    {RESERVE_STATUS[lang][b.statusKey]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* quick actions */}
          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>{t.quickActions}</div>
          <div className="mt-3 flex flex-col gap-[11px]">
            <button
              onClick={() => onNavigate("matching")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
                <Droplet className="w-[21px] h-[21px]" style={{ color: "#E5484D" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>{t.findRequests}</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>{t.findRequestsSub}</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
            </button>
            <button
              onClick={() => onNavigate("compensate")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#EEE9FB" }}>
                <HeartHandshake className="w-[21px] h-[21px]" style={{ color: "#6B4FC0" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>{t.compensateTitle}</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>{t.compensateSub}</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
            </button>
            <button
              onClick={() => onNavigate("donor-registration")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Calendar className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>{t.schedule}</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>{t.scheduleSub}</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
            </button>
          </div>

          {/* recent */}
          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Recent activity</div>
          <div className="mt-3 bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <div className="flex items-center gap-[13px] px-[15px] py-3.5 border-b" style={{ borderColor: "rgba(11,36,50,0.05)" }}>
              <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: "#FFECEC" }}>
                <Droplet className="w-[18px] h-[18px]" style={{ color: "#E5484D" }} fill="#E5484D" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Donation completed</div>
                <div className="text-xs" style={{ color: "#8496A0" }}>City General · 2 days ago</div>
              </div>
              <span className="text-xs font-bold" style={{ color: "#12B76A" }}>+3 lives</span>
            </div>
            <div className="flex items-center gap-[13px] px-[15px] py-3.5">
              <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: "#FFF3E0" }}>
                <Award className="w-[18px] h-[18px]" style={{ color: "#F5871F" }} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Earned "Regular" badge</div>
                <div className="text-xs" style={{ color: "#8496A0" }}>1 week ago</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="rounded-[26px] p-[22px] text-white relative overflow-hidden shadow-[0_22px_40px_-20px_rgba(14,139,168,0.75)]"
            style={{ background: "linear-gradient(135deg,#0E8BA8 0%, #23A6C4 100%)" }}
          >
            <Users className="absolute opacity-[0.15]" style={{ width: 140, height: 140, insetInlineEnd: -20, top: -20 }} stroke="white" fill="none" strokeWidth={1.5} />
            <span className="text-[13px] opacity-90 font-semibold">{t.signedInAs}</span>
            <div className="text-[21px] font-extrabold tracking-[-0.4px]">CHU Mustapha Pacha</div>
            <div className="mt-4 flex gap-2.5">
              <div className="flex-1 bg-white/[0.16] rounded-[14px] px-[13px] py-[11px]">
                <div className="text-[22px] font-extrabold">8</div>
                <div className="text-[11.5px] opacity-90">{t.activeRequests}</div>
              </div>
              <div className="flex-1 bg-white/[0.16] rounded-[14px] px-[13px] py-[11px]">
                <div className="text-[22px] font-extrabold">14</div>
                <div className="text-[11.5px] opacity-90">{t.donorsMatched}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("console")}
            className="cursor-pointer mt-3.5 w-full rounded-2xl p-3.5 flex items-center justify-center gap-2 text-[13.5px] font-bold"
            style={{ background: "#F2FBFD", color: "#0E8BA8", border: "1.5px dashed rgba(14,139,168,0.4)" }}
          >
            <Calendar className="w-[17px] h-[17px]" />
            {t.openConsole}
          </button>

          <div className="grid grid-cols-3 gap-[11px] mt-3.5">
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#0E8BA8" }}>156</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>Total</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#12B76A" }}>8</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>Active</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#E5484D" }}>2</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>{t.critical}</div>
            </div>
          </div>

          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>{t.quickActions}</div>
          <div className="mt-3 flex flex-col gap-[11px]">
            <button
              onClick={() => onNavigate("hospital")}
              className="cursor-pointer text-left w-full rounded-2xl p-4 text-white flex items-center gap-[14px] shadow-[0_16px_28px_-18px_rgba(14,139,168,0.9)]"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)", textAlign: "start" }}
            >
              <span className="w-11 h-11 rounded-[13px] bg-white/20 flex items-center justify-center shrink-0">
                <Droplet className="w-[21px] h-[21px]" />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold">View blood requests</span>
                <span className="block text-[12.5px] opacity-90">Manage all open requests</span>
              </span>
              <span className="text-xs font-extrabold bg-white/[0.22] px-2.5 py-1 rounded-full">8</span>
            </button>
            <button
              onClick={() => onNavigate("matching")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Users className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>{t.findDonors}</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>{t.findDonorsSub}</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2", transform: chevronFlip }} />
            </button>
          </div>

          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Recent matches</div>
          <div className="mt-3 bg-white border rounded-2xl px-[15px] py-3.5 flex items-center gap-[13px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <span
              className="w-[38px] h-[38px] rounded-full text-white flex items-center justify-center font-extrabold text-sm"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#12B76A)" }}
            >
              SJ
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Sarah Johnson · A+</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>Confirmed · arriving 3:40 PM</div>
            </div>
            <span className="text-[11.5px] font-bold px-[9px] py-1 rounded-full" style={{ color: "#12B76A", background: "#E6F8EF" }}>Matched</span>
          </div>
        </div>
      )}
    </div>
  );
}
