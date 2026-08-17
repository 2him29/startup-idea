/**
 * Runtime feature flags.
 *
 * Configured by the host app rather than read from the environment directly,
 * for the same reason configureSupabase() exists: this package stays
 * framework-agnostic, so Vite's import.meta.env doesn't leak into code that a
 * React Native or Node caller also compiles.
 */

export interface Features {
  /**
   * Patient/association model: patients and families post requests, and
   * associations verify them. While false, the app runs the legacy
   * hospital-account flow untouched. Flip it only once a pilot association has
   * verified real requests end to end.
   */
  patientModel: boolean;
}

const defaults: Features = { patientModel: false };

let features: Features = { ...defaults };

export function configureFeatures(next: Partial<Features>): void {
  features = { ...defaults, ...next };
}

export function getFeatures(): Features {
  return features;
}

export function isPatientModelEnabled(): boolean {
  return features.patientModel;
}
