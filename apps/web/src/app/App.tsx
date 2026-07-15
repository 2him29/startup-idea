import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { AuthScreen } from "./components/AuthScreen";
import { DonorRegistration } from "./components/DonorRegistration";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { MatchingScreen } from "./components/MatchingScreen";
import { RequestDetail } from "./components/RequestDetail";
import { MatchConfirm } from "./components/MatchConfirm";
import { CompensateScreen } from "./components/CompensateScreen";
import { HospitalConsole } from "./components/HospitalConsole";
import { DrivesScreen } from "./components/DrivesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { EditProfileScreen } from "./components/EditProfileScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BottomNavigation } from "./components/BottomNavigation";
import { Sidebar } from "./components/Sidebar";
import { bloodRequests, signInDemo, signOut, useSession, type BloodRequest, type Profile } from "@weare/core";
import { useI18n } from "./i18n/LangContext";
import { WifiOff } from "lucide-react";

/** Live online/offline status from the browser's connectivity events. */
function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export default function App() {
  const { profile, loading: sessionLoading, refresh: refreshProfile } = useSession();
  const { t } = useI18n();
  const online = useOnline();
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

  const handleDemoLogin = async (role: "donor" | "hospital") => {
    const authProfile = await signInDemo(role);
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
            profile={profile}
            onSetUserType={handleSelectRole}
            onDemoLogin={handleDemoLogin}
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
      case "compensate":
        return <CompensateScreen onBack={handleBack} onComplete={handleBack} />;
      case "console":
        return <HospitalConsole onBack={handleBack} />;
      case "drives":
        return <DrivesScreen onBack={handleBack} />;
      case "profile":
        return (
          <ProfileScreen
            onBack={handleBack}
            onNavigate={handleNavigate}
            userType={userType}
            profile={profile}
            onSignOut={handleSignOut}
          />
        );
      case "edit-profile":
        return (
          <EditProfileScreen
            onBack={() => setCurrentScreen("profile")}
            userType={userType}
            profile={profile}
            onSaved={refreshProfile}
          />
        );
      case "settings":
        return <SettingsScreen onBack={() => setCurrentScreen("profile")} />;
      default:
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userType={userType}
            profile={profile}
            onSetUserType={handleSelectRole}
            onDemoLogin={handleDemoLogin}
          />
        );
    }
  };

  const screen = renderScreen();
  // Pre-login (splash/auth) has no sidebar, so let it use the full viewport
  // as a real landing page instead of sitting in the same content column
  // that's deliberately width-capped for signed-in dashboard screens. The
  // hospital console brings its own sidebar/layout, so it's full-bleed too.
  const isConsole = currentScreen === "console";
  const isFullBleed = !userType || isConsole;

  return (
    <div className="size-full bg-background md:flex">
      {!online && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-white text-[12.5px] font-bold"
          style={{ background: "#5A6B75" }}
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          {t.offlineBanner}
        </div>
      )}
      {!isConsole && <Sidebar activeScreen={currentScreen} onNavigate={handleNavigate} userType={userType} />}
      <div className="max-w-md mx-auto h-full relative md:max-w-none md:mx-0 md:flex-1 md:h-screen md:overflow-y-auto">
        <div key={currentScreen} style={{ animation: "waScreen .28s ease both" }}>
          {isFullBleed ? screen : <div className="md:px-10 md:py-8">{screen}</div>}
        </div>
        {!isConsole && (
          <BottomNavigation
            activeScreen={currentScreen}
            onNavigate={handleNavigate}
            userType={userType}
          />
        )}
      </div>
    </div>
  );
}
