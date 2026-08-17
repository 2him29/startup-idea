import { Home, Search, User, LayoutList, HeartHandshake, BadgeCheck, Droplet } from "lucide-react";
import { isPatientModelEnabled } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

const visibleOn = ["home", "matching", "profile", "hospital", "compensate", "post-request", "association"];

export function BottomNavigation({ activeScreen, onNavigate, userType }: BottomNavigationProps) {
  const { t } = useI18n();
  if (!userType || !visibleOn.includes(activeScreen)) return null;

  const patientModel = isPatientModelEnabled();
  // Under the patient model the hospital account type no longer has a nav of
  // its own — hospitals are a text field on a request, not a role — so every
  // signed-in user gets the donor-side navigation.
  const isHospital = userType === "hospital" && !patientModel;
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const accentSoft = isHospital ? "#E4F6FB" : "#FFECEC";

  const navItems = patientModel
    ? [
        { id: "home", icon: Home, label: t.navHome },
        { id: "matching", icon: Search, label: t.navFind },
        { id: "post-request", icon: Droplet, label: t.navRequestLabel },
        { id: "association", icon: BadgeCheck, label: t.navVerifyLabel },
        { id: "profile", icon: User, label: t.navProfile },
      ]
    : [
        { id: "home", icon: Home, label: t.navHome },
        ...(isHospital ? [{ id: "hospital", icon: LayoutList, label: t.requestsNav }] : []),
        { id: "matching", icon: Search, label: isHospital ? t.donorsNav : t.navFind },
        ...(isHospital ? [] : [{ id: "compensate", icon: HeartHandshake, label: t.navGive }]),
        { id: "profile", icon: User, label: t.navProfile },
      ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[15] px-4 pt-[9px] md:hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(11,36,50,0.07)",
        paddingBottom: "calc(9px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="cursor-pointer border-none flex flex-col items-center gap-[3px] px-4 py-2 rounded-[14px]"
              style={{
                background: isActive ? accentSoft : "transparent",
                color: isActive ? accent : "#9AA9B2",
              }}
            >
              <Icon className="w-[23px] h-[23px]" strokeWidth={2} />
              <span className="text-[11px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
