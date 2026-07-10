import { useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { DonorRegistration } from "./components/DonorRegistration";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { MatchingScreen } from "./components/MatchingScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { BottomNavigation } from "./components/BottomNavigation";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>("home");
  const [userType, setUserType] = useState<"donor" | "hospital" | null>(null);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleSetUserType = (type: "donor" | "hospital") => {
    setUserType(type);
    setCurrentScreen("home");
  };

  const handleBack = () => {
    setCurrentScreen("home");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userType={userType}
            onSetUserType={handleSetUserType}
          />
        );
      case "donor-registration":
        return <DonorRegistration onBack={handleBack} />;
      case "hospital":
        return <HospitalDashboard onBack={handleBack} />;
      case "matching":
        return <MatchingScreen onBack={handleBack} userType={userType} />;
      case "profile":
        return <ProfileScreen onBack={handleBack} userType={userType} />;
      default:
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userType={userType}
            onSetUserType={handleSetUserType}
          />
        );
    }
  };

  return (
    <div className="size-full bg-background">
      <div className="max-w-md mx-auto h-full relative">
        {renderScreen()}
        <BottomNavigation
          activeScreen={currentScreen}
          onNavigate={handleNavigate}
          userType={userType}
        />
      </div>
    </div>
  );
}
