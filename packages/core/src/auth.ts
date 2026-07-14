import { getSupabase } from "./supabaseClient";

export type UserRole = "donor" | "hospital";

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string | null;
}

interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string;
}

/**
 * Uses maybeSingle(), not single(): right after sign-up, the profile row
 * insert and this session's auth-state-triggered refetch can race, so "no
 * row yet" is an expected transient state, not an error.
 */
async function fetchProfile(userId: string, email: string | null): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const row = data as ProfileRow;
  return { id: row.id, role: row.role, fullName: row.full_name, email };
}

export async function signUpDonor(params: { fullName: string; email: string; password: string }): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({ email: params.email, password: params.password });
  if (error) throw error;
  const userId = data.user!.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, role: "donor", full_name: params.fullName });
  if (profileError) throw profileError;

  return { id: userId, role: "donor", fullName: params.fullName, email: params.email };
}

export async function signUpHospital(params: { hospitalName: string; email: string; password: string }): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({ email: params.email, password: params.password });
  if (error) throw error;
  const userId = data.user!.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, role: "hospital", full_name: params.hospitalName });
  if (profileError) throw profileError;

  const { error: hospitalError } = await supabase
    .from("hospitals")
    .insert({ owner_id: userId, name: params.hospitalName });
  if (hospitalError) throw hospitalError;

  return { id: userId, role: "hospital", fullName: params.hospitalName, email: params.email };
}

export async function signIn(params: { email: string; password: string }): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
  const profile = await fetchProfile(data.user.id, data.user.email ?? null);
  if (!profile) throw new Error("No profile found for this account");
  return profile;
}

/** Pre-seeded accounts for investor/demo walkthroughs -- not secret, just a shortcut past the sign-up form. */
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; password: string }> = {
  donor: { email: "demo.donor@weare.app", password: "WeAreDemo123!" },
  hospital: { email: "demo.hospital@weare.app", password: "WeAreDemo123!" },
};

export async function signInDemo(role: UserRole): Promise<Profile> {
  return signIn(DEMO_ACCOUNTS[role]);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  return fetchProfile(data.session.user.id, data.session.user.email ?? null);
}

export async function upsertDonorProfile(params: { bloodType: string; age: number | null; weightKg: number | null }): Promise<void> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to update donor profile");

  const { error } = await supabase.from("donor_profiles").upsert({
    id: sessionData.session.user.id,
    blood_type: params.bloodType,
    age: params.age,
    weight_kg: params.weightKg,
  });
  if (error) throw error;
}

export interface DonorProfile {
  bloodType: string;
  age: number | null;
  weightKg: number | null;
}

interface DonorProfileRow {
  blood_type: string;
  age: number | null;
  weight_kg: number | null;
}

export async function getDonorProfile(): Promise<DonorProfile | null> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;

  const { data, error } = await supabase
    .from("donor_profiles")
    .select("blood_type, age, weight_kg")
    .eq("id", sessionData.session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as DonorProfileRow;
  return { bloodType: row.blood_type, age: row.age, weightKg: row.weight_kg };
}

export async function updateFullName(fullName: string): Promise<void> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to update profile");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", sessionData.session.user.id);
  if (error) throw error;
}
