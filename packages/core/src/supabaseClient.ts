import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Each app (web, mobile) reads its own env vars and calls this once at
 * startup — kept out of this shared package so it stays framework-agnostic
 * (Vite's import.meta.env vs Expo's process.env would otherwise leak in).
 */
export function configureSupabase(url: string, anonKey: string) {
  client = createClient(url, anonKey);
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error("configureSupabase() must be called before using the API");
  }
  return client;
}
