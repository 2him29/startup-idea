
  import { createRoot } from "react-dom/client";
  import { configureSupabase } from "@weare/core";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  configureSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  createRoot(document.getElementById("root")!).render(<App />);
