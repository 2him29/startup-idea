/**
 * Who can give blood to whom.
 *
 * This is the one module in the app where being wrong is a medical error
 * rather than a bad experience, so the table is written out in full rather
 * than derived from clever antigen arithmetic. A reader should be able to
 * check it against a transfusion chart line by line without reasoning about
 * the code.
 *
 * These are red-cell rules — the ones that matter for a whole-blood or packed
 * red-cell donation, which is what Qatra coordinates. Plasma compatibility runs
 * the other way round and is deliberately NOT modelled here: nothing in the app
 * distinguishes the two yet, and quietly applying the wrong direction would be
 * the exact failure this file exists to prevent.
 *
 * The key is the RECIPIENT — the patient the request is for — and the value is
 * every donor type that can safely give to them.
 */
const CAN_RECEIVE_FROM: Record<string, readonly string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export const BLOOD_TYPES = Object.keys(CAN_RECEIVE_FROM);

/** Normalises "o+", "O +", "0+" to "O+". The zero is a common typo for O. */
function normalise(type: string | null | undefined): string | null {
  if (!type) return null;
  const cleaned = type.trim().toUpperCase().replace(/\s+/g, "").replace(/^0/, "O");
  return cleaned in CAN_RECEIVE_FROM ? cleaned : null;
}

/**
 * Whether `donorType` can give red cells to `recipientType`.
 *
 * Returns false — never true — when either type is unrecognised or missing.
 * An unknown type means we do not know, and in this direction the safe answer
 * to "do we know this is safe?" is no. A donor who is told nothing loses a
 * prompt; a donor wrongly told they match may turn up and be turned away, or
 * worse, be believed.
 */
export function canDonate(donorType: string | null | undefined, recipientType: string | null | undefined): boolean {
  const donor = normalise(donorType);
  const recipient = normalise(recipientType);
  if (!donor || !recipient) return false;
  return CAN_RECEIVE_FROM[recipient].includes(donor);
}

/** Every donor type that can give to this patient, for "who we are looking for". */
export function compatibleDonors(recipientType: string | null | undefined): readonly string[] {
  const recipient = normalise(recipientType);
  return recipient ? CAN_RECEIVE_FROM[recipient] : [];
}

/** Whether this donor is the universal one, worth saying out loud. */
export function isUniversalDonor(donorType: string | null | undefined): boolean {
  return normalise(donorType) === "O-";
}

export type MatchKind = "exact" | "compatible" | "incompatible" | "unknown";

/**
 * How a donor relates to a request, for the label on a request card.
 *
 * "exact" and "compatible" are separated because they read differently to a
 * frightened person: an exact match is unambiguous, while "compatible" invites
 * the question "are you sure?" and deserves the more careful wording.
 *
 * "unknown" is its own answer rather than being folded into "incompatible" —
 * a donor who has not recorded their blood type should be asked for it, not
 * told they cannot help.
 */
export function matchKind(
  donorType: string | null | undefined,
  recipientType: string | null | undefined
): MatchKind {
  const donor = normalise(donorType);
  const recipient = normalise(recipientType);
  if (!donor || !recipient) return "unknown";
  if (donor === recipient) return "exact";
  return canDonate(donor, recipient) ? "compatible" : "incompatible";
}
