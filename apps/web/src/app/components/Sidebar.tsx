import { Home, Search, User, LayoutList, HeartHandshake, BadgeCheck, Droplet } from "lucide-react";
import { isPatientModelEnabled, useCommitteeInbox } from "@weare/core";
import { QatraMark, QatraWordmark } from "./QatraMark";
import { LangSwitcher } from "./LangSwitcher";
import { useI18n } from "../i18n/LangContext";

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

export function Sidebar({ activeScreen, onNavigate, userType }: SidebarProps) {
  // Hooks first — this component returns null when signed out.
  const { t } = useI18n();
  const patientModel = isPatientModelEnabled();
  const { isMember, waiting } = useCommitteeInbox();

  if (!userType) return null;
  // Mirrors BottomNavigation: under the patient model the hospital role has no
  // console of its own, so the sidebar shows one navigation for everyone.
  const isHospital = userType === "hospital" && !patientModel;
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const accentSoft = isHospital ? "#E4F6FB" : "#FFECEC";

  /**
   * Nav B: five slots, and the fourth is the one that changes.
   *
   * A donor sees Give. A member of an approved committee sees Committee, which
   * opens a hub covering both verifying and donor search — one job with two
   * tools, so one tab. Give stays reachable from the Home quick actions, which
   * matters during Ramadan when compensation is the busiest flow in the app.
   *
   * Verify and Donors were separate tabs before this, which made six — two too
   * many for a phone, and both irrelevant to the overwhelming majority of users
   * who are only ever donors.
   */
  const navItems = patientModel
    ? [
        { id: "home", icon: Home, label: t.navHome },
        { id: "matching", icon: Search, label: t.navFind },
        { id: "post-request", icon: Droplet, label: t.navRequestLabel },
        isMember
          ? { id: "committee", icon: BadgeCheck, label: t.navCommittee, badge: waiting }
          : { id: "compensate", icon: HeartHandshake, label: t.navGive },
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
      className="hidden md:flex md:flex-col md:w-[240px] md:shrink-0 md:h-screen md:sticky md:top-0 px-5 py-6"
      style={{ borderInlineEnd: "1px solid rgba(11,36,50,0.07)", background: "#FFFFFF" }}
    >
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <QatraMark size={32} radius={10} />
        <QatraWordmark size={22} />
      </div>

      <LangSwitcher className="mb-6 self-start" />

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="cursor-pointer border-none flex items-center gap-3 px-3 py-3 rounded-[14px]"
              style={{
                background: isActive ? accentSoft : "transparent",
                color: isActive ? accent : "#5A6B75",
                textAlign: "start",
              }}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-[14.5px] font-bold flex-1">{item.label}</span>
              {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                <span
                  className="text-[11px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center"
                  style={{ background: "#E5484D", color: "#fff" }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
