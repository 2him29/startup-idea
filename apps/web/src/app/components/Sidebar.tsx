import { Home, Search, User, LayoutList, HeartHandshake } from "lucide-react";
import { QatraMark, QatraWordmark } from "./QatraMark";
import { LangSwitcher } from "./LangSwitcher";
import { useI18n } from "../i18n/LangContext";

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

export function Sidebar({ activeScreen, onNavigate, userType }: SidebarProps) {
  const { t } = useI18n();
  if (!userType) return null;

  const isHospital = userType === "hospital";
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const accentSoft = isHospital ? "#E4F6FB" : "#FFECEC";

  const navItems = [
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
              <span className="text-[14.5px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
