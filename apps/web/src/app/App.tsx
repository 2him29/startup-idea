import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { AuthScreen } from "./components/AuthScreen";
import { DonorRegistration } from "./components/DonorRegistration";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { MatchingScreen } from "./components/MatchingScreen";
import { RequestDetail } from "./components/RequestDetail";
import { MatchConfirm } from "./components/MatchConfirm";
import { ProfileScreen } from "./components/ProfileScreen";
import { BottomNavigation } from "./components/BottomNavigation";
import { Sidebar } from "./components/Sidebar";
import { bloodRequests, signOut, useSession, type BloodRequest, type Profile } from "@weare/core";

export default function App() {
  const { profile, loading: sessionLoading } = useSession();
  const [currentScreen, setCurrentScreen] = useState<string>("home");
  const [userType, setUserType] = useState<"donor" | "hospital" | null>(null);
  const [pendingRole, setPendingRole] = useState<"donor" | "hospital" | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest>(bloodRequests[0]);

  // Resume an existing session: skip the splash screen once we know who's signed in.
  useEffect(() => {
    if (profile) setUserType(profile.role);
  }, [profile]);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleSelectRole = (type: "donor" | "hospital") => {
    setPendingRole(type);
    setCurrentScreen("auth");
  };

  const handleAuthenticated = (authProfile: Profile) => {
    setUserType(authProfile.role);
    setCurrentScreen("home");
  };

  const handleSignOut = async () => {
    await signOut();
    setUserType(null);
    setCurrentScreen("home");
  };

  const handleBack = () => {
    setCurrentScreen("home");
  };

  const handleOpenDetail = (request: BloodRequest) => {
    setSelectedRequest(request);
    setCurrentScreen("request-detail");
  };

  if (sessionLoading) {
    return <div className="size-full bg-background" />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userType={userType}
            onSetUserType={handleSelectRole}
          />
        );
      case "auth":
        return (
          <AuthScreen
            role={pendingRole ?? "donor"}
            onBack={handleBack}
            onAuthenticated={handleAuthenticated}
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
        return (
          <ProfileScreen
            onBack={handleBack}
            userType={userType}
            profile={profile}
            onSignOut={handleSignOut}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userType={userType}
            onSetUserType={handleSelectRole}
          />
        );
    }
  };

  const screen = renderScreen();

  return (
    <div className="size-full bg-background lg:flex">
      <Sidebar activeScreen={currentScreen} onNavigate={handleNavigate} userType={userType} />
      <div className="max-w-md mx-auto h-full relative lg:max-w-none lg:mx-0 lg:flex-1 lg:h-screen lg:overflow-y-auto">
        <div className="lg:max-w-5xl lg:mx-auto lg:px-10 lg:py-8">{screen}</div>
        <BottomNavigation
          activeScreen={currentScreen}
          onNavigate={handleNavigate}
          userType={userType}
        />
      </div>
    </div>
  );
}
