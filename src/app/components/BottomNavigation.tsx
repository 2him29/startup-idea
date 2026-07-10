import { Home, Search, User, Building2 } from "lucide-react";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

export function BottomNavigation({ activeScreen, onNavigate, userType }: BottomNavigationProps) {
  if (!userType) return null;

  const isDonor = userType === "donor";

  const navItems = isDonor
    ? [
        { id: "home", icon: Home, label: "Home" },
        { id: "matching", icon: Search, label: "Find" },
        { id: "profile", icon: User, label: "Profile" },
      ]
    : [
        { id: "home", icon: Home, label: "Home" },
        { id: "hospital", icon: Building2, label: "Requests" },
        { id: "matching", icon: Search, label: "Donors" },
        { id: "profile", icon: User, label: "Profile" },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-red-100 shadow-lg z-50">
      <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? isDonor
                    ? "bg-red-50"
                    : "bg-cyan-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive
                    ? isDonor
                      ? "text-red-500"
                      : "text-cyan-600"
                    : "text-gray-500"
                }`}
              />
              <span
                className={`${
                  isActive
                    ? isDonor
                      ? "text-red-500"
                      : "text-cyan-600"
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
