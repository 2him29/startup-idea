import { Home, Search, User, LayoutList } from "lucide-react";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

const visibleOn = ["home", "matching", "profile", "hospital"];

export function BottomNavigation({ activeScreen, onNavigate, userType }: BottomNavigationProps) {
  if (!userType || !visibleOn.includes(activeScreen)) return null;

  const isHospital = userType === "hospital";
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const accentSoft = isHospital ? "#E4F6FB" : "#FFECEC";

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    ...(isHospital ? [{ id: "hospital", icon: LayoutList, label: "Requests" }] : []),
    { id: "matching", icon: Search, label: isHospital ? "Donors" : "Find" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[15] px-4 pt-[9px] md:hidden"
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
