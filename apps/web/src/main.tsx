
  import { createRoot } from "react-dom/client";
  import { configureSupabase } from "@weare/core";
  import { LangProvider } from "./app/i18n/LangContext.tsx";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  configureSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  createRoot(document.getElementById("root")!).render(
    <LangProvider>
      <App />
    </LangProvider>
  );
