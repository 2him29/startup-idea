import { getSupabase } from "./supabaseClient";

/**
 * Phone verification, behind a provider interface.
 *
 * Deliberately not bound to one vendor yet: Supabase's built-in phone auth,
 * Firebase phone auth, and a dedicated SMS gateway with Algeria/MENA routing
 * all need benchmarking on deliverability to Djezzy/Ooredoo/Mobilis numbers
 * before one is locked in. Swapping providers should mean writing one object
 * that satisfies OtpProvider and calling configureOtpProvider() — nothing in
 * the UI should have to change.
 */

export interface OtpProvider {
  /** Human-readable id, surfaced in logs so it's obvious which path ran. */
  readonly name: string;
  /** Send a code to a phone number in E.164 form (+213…). */
  sendCode(phone: string): Promise<void>;
  /** Check a code. Resolves on success, throws with a user-safe message otherwise. */
  verifyCode(phone: string, code: string): Promise<void>;
}

/**
 * Supabase's own phone OTP, for a user who already has an email session.
 *
 * Attaching a phone to an existing account is a *phone change* in Supabase's
 * model, not a sign-in — using signInWithOtp here would mint a second identity
 * instead of verifying the current one. Requires an SMS provider configured in
 * the Supabase dashboard; without one, sendCode throws and the caller shows
 * the error.
 */
export const supabaseOtpProvider: OtpProvider = {
  name: "supabase-phone",

  async sendCode(phone: string): Promise<void> {
    const { error } = await getSupabase().auth.updateUser({ phone });
    if (error) throw error;
  },

  async verifyCode(phone: string, code: string): Promise<void> {
    const { error } = await getSupabase().auth.verifyOtp({ phone, token: code, type: "phone_change" });
    if (error) throw error;
  },
};

/**
 * Offline stand-in for demos and Playwright runs: accepts one fixed code and
 * sends no SMS. Never selected automatically — a caller has to configure it,
 * so it cannot silently become the production path.
 */
export const DEMO_OTP_CODE = "000000";

export const demoOtpProvider: OtpProvider = {
  name: "demo-no-sms",

  async sendCode(): Promise<void> {
    // No SMS is sent; the fixed DEMO_OTP_CODE is what verifyCode accepts.
  },

  async verifyCode(_phone: string, code: string): Promise<void> {
    if (code !== DEMO_OTP_CODE) throw new Error("Incorrect code");
  },
};

let provider: OtpProvider = supabaseOtpProvider;

export function configureOtpProvider(next: OtpProvider): void {
  provider = next;
}

export function getOtpProvider(): OtpProvider {
  return provider;
}

export async function sendVerificationCode(phone: string): Promise<void> {
  await provider.sendCode(phone);
}

/**
 * Verify the code, then record the result on the profile. The flag lives in
 * our own table rather than being read off the auth user because RLS policies
 * need to check it (is_phone_verified()), and policies can't reach into
 * auth.users for arbitrary fields.
 */
export async function confirmVerificationCode(phone: string, code: string): Promise<void> {
  await provider.verifyCode(phone, code);

  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to verify a phone number");

  const { error } = await supabase
    .from("profiles")
    .update({ phone, phone_verified: true })
    .eq("id", sessionData.session.user.id);
  if (error) throw error;
}

export async function isPhoneVerified(): Promise<boolean> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("phone_verified")
    .eq("id", sessionData.session.user.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean((data as { phone_verified: boolean } | null)?.phone_verified);
}

/** Algerian mobile numbers are +213 followed by 9 digits starting 5/6/7. */
export function normalizeAlgerianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  const local = digits.replace(/^\+?213/, "").replace(/^0/, "");
  if (!/^[567]\d{8}$/.test(local)) return null;
  return `+213${local}`;
}
