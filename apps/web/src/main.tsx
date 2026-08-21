
  import { createRoot } from "react-dom/client";
  import { configureSupabase, configureFeatures, configureOtpProvider, configurePush, demoOtpProvider } from "@weare/core";
  import { LangProvider } from "./app/i18n/LangContext.tsx";
  import { ToastProvider } from "./app/components/Toast.tsx";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  configureSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Patient/association model. Off unless VITE_PATIENT_MODEL is explicitly
  // "true", so an unset or misspelled env var falls back to the legacy
  // hospital flow rather than half-enabling a migration in progress.
  configureFeatures({ patientModel: import.meta.env.VITE_PATIENT_MODEL === "true" });

  /*
   * Phone verification without an SMS provider.
   *
   * The default provider goes through Supabase phone auth, which needs Twilio
   * configured on the project. Without this the request flow cannot be
   * completed at all below production — not by a demo, not by Playwright, and
   * not by anyone looking at the app on a branch — because posting a request
   * requires a verified number and there is no way to obtain one.
   *
   * Opt-in and exact-match only, for the same reason the patient-model flag is:
   * a typo must fall back to the real provider, never the other way round. The
   * demo provider accepts one fixed code (DEMO_OTP_CODE) and sends nothing.
   */
  if (import.meta.env.VITE_DEMO_OTP === "true") {
    configureOtpProvider(demoOtpProvider);
  }

  /*
   * Web push. Only the PUBLIC half of the VAPID pair belongs here — every
   * VITE_* variable is inlined into the client bundle, so putting the private
   * key in .env would publish it to anyone who opens devtools. The private key
   * lives in the edge function's secrets and nowhere else.
   *
   * Absent key means push simply reports itself unsupported and the settings
   * toggle explains that, rather than offering a button that cannot work.
   */
  configurePush(import.meta.env.VITE_VAPID_PUBLIC_KEY);

  createRoot(document.getElementById("root")!).render(
    <LangProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LangProvider>
  );
