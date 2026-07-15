// Device-local preferences (not account data): persisted to localStorage so
// they survive reloads but stay per-device, matching how the language choice
// already works in LangContext.

const KEYS = {
  ramadan: "qatra-pref-ramadan",
  defaultWilaya: "qatra-pref-wilaya",
  notifUrgent: "qatra-pref-notif-urgent",
  notifRamadan: "qatra-pref-notif-ramadan",
  notifNearby: "qatra-pref-notif-nearby",
} as const;

type BoolKey = Exclude<keyof typeof KEYS, "defaultWilaya">;

export function getBoolPref(key: BoolKey, fallback: boolean): boolean {
  const stored = window.localStorage.getItem(KEYS[key]);
  return stored === null ? fallback : stored === "true";
}

export function setBoolPref(key: BoolKey, value: boolean): void {
  window.localStorage.setItem(KEYS[key], String(value));
}

export function getDefaultWilaya(): string | null {
  return window.localStorage.getItem(KEYS.defaultWilaya);
}

/**
 * True during the actual month of Ramadan (9th Hijri month, Umm al-Qura
 * calendar). Used as the Ramadan banner's default so it appears on its own
 * each year; the Settings toggle still overrides in either direction.
 */
export function isRamadanNow(): boolean {
  try {
    const month = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" }).format(new Date());
    return parseInt(month, 10) === 9;
  } catch {
    return false;
  }
}

export function setDefaultWilaya(wilaya: string | null): void {
  if (wilaya) window.localStorage.setItem(KEYS.defaultWilaya, wilaya);
  else window.localStorage.removeItem(KEYS.defaultWilaya);
}
