import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { AuthScreen } from "./components/AuthScreen";
import { DonorRegistration } from "./components/DonorRegistration";
import { HospitalDashboard } from "./components/HospitalDashboard";
import { MatchingScreen } from "./components/MatchingScreen";
import { RequestDetail } from "./components/RequestDetail";
import { RequestPostedScreen } from "./components/RequestPostedScreen";
import { MatchConfirm } from "./components/MatchConfirm";
import { CompensateScreen } from "./components/CompensateScreen";
import { HospitalConsole } from "./components/HospitalConsole";
import { HospitalsScreen } from "./components/HospitalsScreen";
import { DrivesScreen } from "./components/DrivesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { EditProfileScreen } from "./components/EditProfileScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BottomNavigation } from "./components/BottomNavigation";
import { Sidebar } from "./components/Sidebar";
import { PatientRequestScreen, type RequestDraft } from "./components/PatientRequestScreen";
import { PhoneVerificationScreen } from "./components/PhoneVerificationScreen";
import { AssociationConsole } from "./components/AssociationConsole";
import { CommitteeHub } from "./components/CommitteeHub";
import { DonorSearchScreen } from "./components/DonorSearchScreen";
import { AssociationApplyScreen } from "./components/AssociationApplyScreen";
import { ConsentScreen } from "./components/ConsentScreen";
import { DataRightsScreen } from "./components/DataRightsScreen";
import { bloodRequests, createPatientRequest, isPatientModelEnabled, signInDemo, signOut, unitsLabel, useSession, wilayaLabel, type BloodRequest, type Profile } from "@weare/core";
import { useI18n } from "./i18n/LangContext";
import { WifiOff } from "lucide-react";

/**
 * Plays the screen-entrance animation on every route change, then removes the
 * animation style entirely: a lingering transform (even translateY(0)) would
 * turn this wrapper into the containing block for position:fixed descendants
 * like FABs and bottom sheets, pinning them to the content instead of the
 * viewport.
 */
function ScreenTransition({ children }: { children: React.ReactNode }) {
  const [animating, setAnimating] = useState(true);
  return (
    <div
      style={animating ? { animation: "waScreen .28s ease both" } : undefined}
      onAnimationEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}

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
  const { t, lang } = useI18n();
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

  /**
   * Where to land once the account exists. A visitor who came in through
   * "I need blood" wants the request form, not the donor home.
   */
  const [afterAuth, setAfterAuth] = useState<string>("home");

  const handleSelectRole = (type: "donor" | "hospital" | "patient") => {
    // A patient signs up exactly as a donor does — same table, same policies —
    // so only the destination differs.
    setPendingRole(type === "patient" ? "donor" : type);
    setAfterAuth(type === "patient" ? "post-request" : "home");
    setCurrentScreen("auth");
  };

  /**
   * Where phone verification should return to. Registration sends people
   * onward to home; the request form sends them back to the form they were
   * blocked on.
   */
  const [afterVerify, setAfterVerify] = useState<string>("home");

  /*
   * The request being posted, held across the verification detour.
   *
   * Kept in memory rather than localStorage on purpose. This is a patient's
   * name, blood type and a contact number — health data under Loi 18-07 — and
   * persisting it to disk would outlive the flow, survive the tab closing, and
   * sit there for the next person to use the phone. A reload mid-verification
   * loses the draft; that is the right trade against leaving medical details
   * on a shared device.
   */
  const [requestDraft, setRequestDraft] = useState<RequestDraft | null>(null);
  const [postedDraft, setPostedDraft] = useState<RequestDraft | null>(null);

  /**
   * Verification succeeded. If a request was waiting on it, post it now.
   *
   * The whole point of letting the form run first is that the person does not
   * have to type it again, so finishing the job here is the promise being
   * kept — a return to a still-filled form with the button live would be a
   * second ask after they already pressed Post.
   *
   * A failure leaves the draft alone and returns to the form, where the error
   * belongs and where the text is still on screen.
   */
  const handleVerified = async () => {
    const draft = requestDraft;
    if (!draft) {
      setCurrentScreen(afterVerify);
      return;
    }
    try {
      await createPatientRequest(draft);
      setRequestDraft(null);
      setPostedDraft(draft);
      setCurrentScreen("request-posted");
    } catch (err) {
      console.error("Failed to post the held request after verification", err);
      setCurrentScreen("post-request");
    }
  };

  const handleAuthenticated = (authProfile: Profile, isNewAccount: boolean) => {
    setUserType(authProfile.role);

    // A new account under the patient model goes through phone verification as
    // the last step of registration. Log-ins skip it, and so does the legacy
    // flow, which has no use for a verified number.
    if (isNewAccount && isPatientModelEnabled()) {
      setAfterVerify(afterAuth);
      setCurrentScreen("verify-phone");
      return;
    }
    setCurrentScreen(afterAuth);
  };

  const handleDemoLogin = async (role: "donor" | "hospital" | "patient") => {
    const authProfile = await signInDemo(role === "patient" ? "donor" : role);
    setUserType(authProfile.role);
    setCurrentScreen(role === "patient" ? "post-request" : "home");
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

  const patientModel = isPatientModelEnabled();

  const fallbackHome = (
    <HomeScreen
      onNavigate={handleNavigate}
      userType={userType}
      profile={profile}
      onSetUserType={handleSelectRole}
      onDemoLogin={handleDemoLogin}
    />
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return fallbackHome;
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
            /*
             * Writes before it celebrates. The screen used to navigate
             * straight to a green tick while nothing was recorded, so the
             * family never learned anyone was coming. If the insert fails the
             * detail screen keeps the user and shows why.
             */
            onResponded={() => setCurrentScreen("match-confirm")}
            request={selectedRequest}
          />
        );
      case "match-confirm":
        return <MatchConfirm onBackHome={handleBack} request={selectedRequest} />;
      case "compensate":
        return <CompensateScreen onBack={handleBack} onComplete={handleBack} />;
      case "console":
        return <HospitalConsole onBack={handleBack} />;
      case "hospitals":
        return <HospitalsScreen onBack={handleBack} />;
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
        return <SettingsScreen onBack={() => setCurrentScreen("profile")} onNavigate={handleNavigate} />;
      case "data-rights":
        return <DataRightsScreen onBack={() => setCurrentScreen("settings")} />;
      // Patient-model screens. Reachable only while the flag is on — the nav
      // never offers them otherwise, and this guard keeps a stale deep link or
      // a leftover currentScreen value from rendering a half-migrated flow.
      case "post-request":
        return patientModel ? (
          <PatientRequestScreen
            onBack={handleBack}
            onPosted={(draft) => {
              setPostedDraft(draft);
              setCurrentScreen("request-posted");
            }}
            onNeedsVerification={(draft) => {
              setRequestDraft(draft);
              setAfterVerify("post-request");
              setCurrentScreen("verify-phone");
            }}
          />
        ) : (
          fallbackHome
        );
      case "verify-phone":
        return patientModel ? (
          <PhoneVerificationScreen
            onBack={() => setCurrentScreen(afterVerify)}
            onVerified={handleVerified}
            draftSummary={
              requestDraft
                ? [
                    requestDraft.patientName,
                    requestDraft.bloodType,
                    unitsLabel(requestDraft.units, t, lang),
                    requestDraft.hospitalName.trim() || wilayaLabel(requestDraft.wilaya, lang),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : undefined
            }
            // Skippable only as a registration step. Arriving here from the
            // request form means the user already tried to do something the
            // database will reject without a verified number, so offering
            // "skip" there would just send them back into the same wall.
            onSkip={afterVerify === "home" ? () => setCurrentScreen("home") : undefined}
          />
        ) : (
          fallbackHome
        );
      case "request-posted":
        return patientModel && postedDraft ? (
          <RequestPostedScreen
            draft={postedDraft}
            onSeeRequest={() => setCurrentScreen("matching")}
            onStartAgain={() => {
              setPostedDraft(null);
              setCurrentScreen("post-request");
            }}
          />
        ) : (
          fallbackHome
        );
      case "committee":
        return patientModel ? (
          <CommitteeHub
            onBack={handleBack}
            onNavigate={handleNavigate}
            onApply={() => setCurrentScreen("association-apply")}
          />
        ) : (
          fallbackHome
        );
      case "association":
        return patientModel ? (
          <AssociationConsole onBack={handleBack} onApply={() => setCurrentScreen("association-apply")} />
        ) : (
          fallbackHome
        );
      case "donor-search":
        return patientModel ? <DonorSearchScreen onBack={handleBack} /> : fallbackHome;
      case "association-apply":
        return patientModel ? (
          <AssociationApplyScreen onBack={() => setCurrentScreen("association")} onApplied={() => setCurrentScreen("association")} />
        ) : (
          fallbackHome
        );
      case "consent":
        return <ConsentScreen onBack={handleBack} onConsented={handleBack} />;
      default:
        return fallbackHome;
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
        <ScreenTransition key={currentScreen}>
          {isFullBleed ? screen : <div className="md:px-10 md:py-8">{screen}</div>}
        </ScreenTransition>
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
