
  import { createRoot } from "react-dom/client";
  import { configureSupabase, configureFeatures } from "@weare/core";
  import { LangProvider } from "./app/i18n/LangContext.tsx";
  import { ToastProvider } from "./app/components/Toast.tsx";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  configureSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Patient/association model. Off unless VITE_PATIENT_MODEL is explicitly
  // "true", so an unset or misspelled env var falls back to the legacy
  // hospital flow rather than half-enabling a migration in progress.
  configureFeatures({ patientModel: import.meta.env.VITE_PATIENT_MODEL === "true" });

  createRoot(document.getElementById("root")!).render(
    <LangProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LangProvider>
  );
