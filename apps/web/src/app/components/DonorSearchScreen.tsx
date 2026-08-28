import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Phone, PhoneOff, ShieldAlert, ShieldCheck, ShieldQuestion, Clock, Droplet } from "lucide-react";
import { revealDonorContact, searchDonors, useMyMemberships, wilayaLabel, type DonorSearchResult, errorMessage} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { SCREEN_BG } from "../background";
import { BloodType } from "./BloodType";
import { RequestCardSkeleton } from "./Skeletons";

interface DonorSearchScreenProps {
  onBack: () => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Donor lookup for a verified association, scoped to its own wilaya.
 *
 * Two rules from the database show up directly in this UI, and neither is
 * enforced here — search_donors() re-checks both, so this screen only has to
 * present them honestly:
 *
 *   - A donor inside the 90-day cooldown is hidden unless the coordinator asks
 *     to see them, and then appears greyed out with a countdown. Showing them
 *     at all matters: "nobody is available yet" and "nobody is registered
 *     here" are different problems with different responses.
 *   - A phone number appears only for donors who opted into contact sharing.
 *     For everyone else the row says so plainly rather than showing a blank,
 *     so a coordinator knows to reach them through a request instead of
 *     assuming the data is missing.
 */
export function DonorSearchScreen({ onBack }: DonorSearchScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const { verifying, loading: loadingMemberships } = useMyMemberships();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = verifying[activeIndex]?.association ?? null;

  const [bloodType, setBloodType] = useState<string | null>(null);
  const [includeCooldown, setIncludeCooldown] = useState(false);
  const [donors, setDonors] = useState<DonorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Numbers opened during this visit, by donor id.
   *
   * Deliberately not persisted and deliberately not pre-fetched: the point of
   * the reveal is that it is an act with a record, so it should not survive a
   * reload as if it had never been asked for. Re-opening the screen means
   * asking again, and asking again is logged again — which is the honest
   * accounting of how many times a number was actually taken.
   */
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  const handleReveal = async (donorId: string) => {
    setRevealing(donorId);
    setError(null);
    try {
      const phone = await revealDonorContact(donorId);
      // Null means the donor withdrew consent between the search and the tap.
      // Refreshing the list is the honest response: the card should stop
      // offering a number that is no longer ours to give.
      if (phone) {
        setRevealed((prev) => ({ ...prev, [donorId]: phone }));
      } else {
        setDonors((prev) => prev.map((d) => (d.id === donorId ? { ...d, sharesPhone: false, phone: null } : d)));
      }
    } catch (err) {
      setError(errorMessage(err, t.genericError));
    } finally {
      setRevealing(null);
    }
  };

  useEffect(() => {
    if (!active) {
      setDonors([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchDonors({
      wilaya: active.wilaya,
      bloodType: bloodType ?? undefined,
      includeIneligible: includeCooldown,
    })
      .then((rows) => {
        if (!cancelled) setDonors(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t.donorSearchDenied));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, bloodType, includeCooldown, t.donorSearchDenied]);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.donorSearchTitle}</div>
          {active && (
            <div className="text-[12.5px]" style={{ color: "#8496A0" }}>
              {t.donorSearchSub.replace("{wilaya}", wilayaLabel(active.wilaya, lang))}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  if (loadingMemberships) {
    return shell(<div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <RequestCardSkeleton key={i} />)}</div>);
  }

  // No verified association means the database would reject the search, so the
  // screen explains that rather than showing an empty list that looks like
  // "there are no donors".
  if (!active) {
    return shell(
      <div className="bg-white border rounded-[20px] p-6 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#EEE9FB" }}>
          <ShieldQuestion className="w-7 h-7" style={{ color: "#6B4FC0" }} />
        </span>
        <div className="mt-4 text-[13.5px]" style={{ color: "#6B7C88" }}>{t.donorSearchDenied}</div>
      </div>
    );
  }

  return shell(
    <>
      {verifying.length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {verifying.map((m, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={m.association.id}
                onClick={() => setActiveIndex(i)}
                className="cursor-pointer text-[12.5px] font-bold px-3.5 py-2 rounded-full border"
                style={isActive
                  ? { background: "#6B4FC0", color: "#fff", borderColor: "#6B4FC0" }
                  : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }}
              >
                {wilayaLabel(m.association.wilaya, lang)}
              </button>
            );
          })}
        </div>
      )}

      {/*
        Stated once, at the top, before any names are read.

        Not a consent dialogue and not a warning — the association is entitled
        to be here. It is the standing rule for the screen: blood types and
        phone numbers are health data, opening one is recorded, so open what
        you will use. Putting it above the list rather than beside each card
        means it reads as the terms of the room rather than an accusation
        attached to a particular donor.
      */}
      <div
        className="flex items-start gap-3 rounded-2xl p-4 mb-3"
        style={{ background: "#FFF3E0", border: "1px solid rgba(245,135,31,0.3)" }}
      >
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#F5871F" }} />
        <div style={{ textAlign: "start" }}>
          <div className="text-[13px] font-extrabold" style={{ color: "#7A4A10" }}>{t.healthDataBannerTitle}</div>
          <div className="text-[12px] mt-1 leading-relaxed" style={{ color: "#8A6534" }}>{t.healthDataBannerBody}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {[null, ...bloodTypes].map((b) => {
          const isActive = bloodType === b;
          return (
            <button
              key={b ?? "all"}
              onClick={() => setBloodType(b)}
              className="cursor-pointer text-[12.5px] font-bold px-3 py-1.5 rounded-full border"
              style={isActive
                ? { background: "#E5484D", color: "#fff", borderColor: "#E5484D" }
                : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }}
            >
              {b ?? t.allTypesLabel}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setIncludeCooldown((v) => !v)}
        className="cursor-pointer w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 border bg-white"
        style={{ borderColor: "rgba(11,36,50,0.08)", textAlign: "start" }}
      >
        <span
          className="w-[22px] h-[22px] rounded-[7px] shrink-0 flex items-center justify-center border-2"
          style={{
            background: includeCooldown ? "#0E8BA8" : "transparent",
            borderColor: includeCooldown ? "#0E8BA8" : "rgba(11,36,50,0.2)",
          }}
        >
          {includeCooldown && <Clock className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>
        <span className="text-[13.5px] font-semibold flex-1" style={{ color: "#0B2432" }}>{t.includeCooldownLabel}</span>
      </button>

      {error && (
        <div className="rounded-2xl px-4 py-3 text-[13px] mb-4" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {loading && [0, 1].map((i) => <RequestCardSkeleton key={`sk-${i}`} />)}

        {!loading && !error && donors.length === 0 && (
          <div className="text-center text-[13.5px] py-10" style={{ color: "#8496A0" }}>{t.noDonorsFound}</div>
        )}

        {!loading && donors.map((donor) => (
          <div
            key={donor.id}
            data-testid="donor-row"
            className="border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
            style={{
              borderColor: "rgba(11,36,50,0.06)",
              animation: "waRise .4s ease both",
              textAlign: "start",
              // Cooling-off donors stay legible but visibly unavailable.
              opacity: donor.isEligible ? 1 : 0.55,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-[13px] min-w-0">
                <span
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                  style={{ background: donor.isEligible ? "linear-gradient(135deg,#E5484D,#F4677E)" : "#C8D2D8" }}
                >
                  <Droplet className="w-5 h-5" fill="white" stroke="none" />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold truncate" style={{ color: "#0B2432" }}>{donor.fullName}</div>
                  <div className="text-[12.5px]" style={{ color: "#8496A0" }}>
                    <BloodType value={donor.bloodType} /> · {wilayaLabel(donor.wilaya, lang)}
                  </div>
                </div>
              </div>
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
                style={donor.isEligible
                  ? { background: "#EAF6EF", color: "#0E7A4B" }
                  : { background: "#F1F5F6", color: "#5A6B75" }}
              >
                {donor.isEligible
                  ? t.eligibleLabel
                  : t.eligibleInDays.replace("{days}", String(donor.daysUntilEligible))}
              </span>
            </div>

            {donor.sharesPhone && donor.phone ? (
              revealed[donor.id] ? (
                <>
                  <a
                    href={`tel:${revealed[donor.id]}`}
                    className="mt-3.5 w-full h-[46px] rounded-2xl flex items-center justify-center gap-2 text-[14px] font-extrabold no-underline"
                    style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)", color: "#fff" }}
                  >
                    <Phone className="w-[17px] h-[17px]" />
                    {t.callLabel} · <span style={{ direction: "ltr" }}>{revealed[donor.id]}</span>
                  </a>
                  {/* Said after the fact, not as a warning before it. The
                      point is that the record exists, not that taking a
                      number is suspect — ringing donors is the job. */}
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: "#8496A0" }}>
                    <ShieldCheck className="w-[13px] h-[13px]" />
                    {t.revealedJustNow}
                  </div>
                </>
              ) : (
                /*
                 * Masked until asked for.
                 *
                 * The number is not secret — this donor consented to being
                 * phoned — but a screen that hands out fifty numbers to
                 * someone who will ring two is processing more health data
                 * than the purpose needs. One tap per number keeps the volume
                 * honest, and gives the log something meaningful to record.
                 */
                <button
                  onClick={() => handleReveal(donor.id)}
                  disabled={revealing === donor.id}
                  data-testid="reveal-number"
                  className="cursor-pointer disabled:opacity-60 mt-3.5 w-full h-[46px] rounded-2xl flex items-center justify-center gap-2 text-[14px] font-extrabold border-[1.5px] bg-white"
                  style={{ borderColor: "rgba(14,139,168,0.35)", color: "#0E8BA8" }}
                >
                  <Eye className="w-[17px] h-[17px]" />
                  {revealing === donor.id ? t.revealing : t.revealNumber}
                  <span className="font-semibold" style={{ direction: "ltr", color: "#8496A0" }}>{donor.phone}</span>
                </button>
              )
            ) : (
              <div
                className="mt-3.5 flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
                style={{ background: "#F7FAFB", border: "1px solid rgba(11,36,50,0.06)" }}
              >
                <PhoneOff className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8496A0" }} />
                <div>
                  <div className="text-[12.5px] font-bold" style={{ color: "#5A6B75" }}>{t.numberNotShared}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "#8496A0" }}>{t.numberNotSharedHint}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
