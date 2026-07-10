import { useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { DonorRegistration } from "./components/DonorRegistration";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { MatchingScreen } from "./components/MatchingScreen";
import { RequestDetail } from "./components/RequestDetail";
import { MatchConfirm } from "./components/MatchConfirm";
import { ProfileScreen } from "./components/ProfileScreen";
import { BottomNavigation } from "./components/BottomNavigation";
import { bloodRequests, type BloodRequest } from "@weare/core";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>("home");
  const [userType, setUserType] = useState<"donor" | "hospital" | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest>(bloodRequests[0]);

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

  const handleOpenDetail = (request: BloodRequest) => {
    setSelectedRequest(request);
    setCurrentScreen("request-detail");
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
        return <DonorRegistration onBack={handleBack} onComplete={handleBack} />;
      case "hospital":
        return <HospitalDashboard onBack={handleBack} />;
      case "matching":
        return <MatchingScreen onBack={handleBack} userType={userType} onOpenDetail={handleOpenDetail} />;
      case "request-detail":
        return (
          <RequestDetail
            onBack={() => setCurrentScreen("matching")}
            onRespond={() => setCurrentScreen("match-confirm")}
            request={selectedRequest}
          />
        );
      case "match-confirm":
        return <MatchConfirm onBackHome={handleBack} request={selectedRequest} />;
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
