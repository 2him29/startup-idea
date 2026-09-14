import { Suspense, lazy, useState } from "react";
import { ArrowLeft, Check, ChevronDown, MapPin, Droplet } from "lucide-react";
import { hospitalLabel, unitsLabel, urgencyStyle, urgencyLabel, useBloodRequests, useResponses, useDonorProfile, canDonate, useCommunes, wilayaLabel, nameStatesWilaya, type BloodRequest, type Urgency, formatRelativeTime } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";
import { getDefaultWilaya } from "../prefs";
import { SCREEN_BG } from "../background";
import { RequestCardSkeleton } from "./Skeletons";
import { VerifiedBadge } from "./VerifiedBadge";
import { PledgeBar } from "./PledgeBar";

interface MatchingScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
  onOpenDetail: (request: BloodRequest) => void;
}

const ALGIERS_CENTER: [number, number] = [36.7755, 3.0597];

/*
 * The map, fetched when there is one to draw.
 *
 * Leaflet is 153 kB, and Find is warmed on idle from App.tsx so a tap opens
 * instantly — which would have pulled the map library onto every visit through
 * the back door. Behind its own import() it stays out of that, and out of the
 * 46 wilayas whose hospitals have no coordinates to plot.
 */
const RequestsMap = lazy(() => import("./RequestsMap"));

export function MatchingScreen({ onBack, userType, onOpenDetail }: MatchingScreenProps) {
  const { t, lang, dir } = useI18n();
  const accent = userType === "hospital" ? "#0E8BA8" : "#E5484D";
  const { requests: allRequests, loading, isFallback } = useBloodRequests();
  // Keyed off every request on screen, so the counts and the donor's own
  // commitments arrive in one pass rather than per card.
  const { goingTo, counts } = useResponses(allRequests.map((r) => r.id));
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const wilayasPresent = Array.from(new Set(allRequests.map((r) => r.wilaya).filter((w): w is string => !!w)));
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(() => getDefaultWilaya());
  // The saved preference may name a wilaya with no open requests right now --
  // fall back to showing everything rather than an empty list.
  const effectiveWilaya = selectedWilaya && wilayasPresent.includes(selectedWilaya) ? selectedWilaya : null;
  const inWilaya = effectiveWilaya ? allRequests.filter((r) => r.wilaya === effectiveWilaya) : allRequests;

  /*
   * Communes offered are the ones that actually have an open request, not all
   * 1541 — the same rule the wilaya pills already follow. A dropdown of places
   * with nothing in them is a list of dead ends.
   */
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);
  const communesPresent = Array.from(
    new Set(inWilaya.map((r) => r.commune).filter((c): c is string => !!c))
  ).sort((a, b) => a.localeCompare(b, "fr"));
  const effectiveCommune = selectedCommune && communesPresent.includes(selectedCommune) ? selectedCommune : null;
  // Labels matter only once the dropdown shows, so the list is fetched only
  // then, not on every visit to the busiest screen in the app.
  const communes = useCommunes(communesPresent.length > 1);
  const inCommune = effectiveCommune ? inWilaya.filter((r) => r.commune === effectiveCommune) : inWilaya;

  /*
   * "I can donate", and it is off by default.
   *
   * The 8x8 table is definitive: an A+ donor cannot give to an O- patient, and
   * showing that request as if they might is the kind of wrong this app cannot
   * afford. But hiding it by default would be wrong too — RequestDetail already
   * says that incompatibility is not a dead end, because sharing a request is a
   * real contribution. So the filter is offered, never assumed, and the empty
   * state says the same thing rather than reading as "nobody needs you".
   */
  const { donorProfile } = useDonorProfile();
  const myType = donorProfile?.bloodType ?? null;
  const [onlyCanHelp, setOnlyCanHelp] = useState(false);
  const canHelpCount = myType ? inCommune.filter((r) => canDonate(myType, r.bloodType)).length : 0;
  const bloodRequests = onlyCanHelp && myType
    ? inCommune.filter((r) => canDonate(myType, r.bloodType))
    : inCommune;

  const mappable = bloodRequests.filter(
    (r): r is BloodRequest & { hospitalLat: number; hospitalLng: number } =>
      r.hospitalLat != null && r.hospitalLng != null
  );

  /**
   * One pin per location, not per request.
   *
   * Coordinates come from the hospital, so every request at the same hospital
   * lands on the identical point — and Leaflet stacks those markers exactly,
   * leaving only the topmost clickable. Blida has a single hospital in the
   * directory and eleven open requests, so ten of them were unreachable on the
   * map: the donor saw one pin and no way to know it stood for eleven people.
   *
   * Grouping keeps the positions truthful (nothing is scattered to fake
   * precision) while making every request reachable through the popup.
   */
  const URGENCY_RANK: Record<Urgency, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  const markerGroups = Array.from(
    mappable.reduce((groups, r) => {
      const key = `${r.hospitalLat},${r.hospitalLng}`;
      const existing = groups.get(key);
      if (existing) existing.requests.push(r);
      else groups.set(key, { key, lat: r.hospitalLat, lng: r.hospitalLng, requests: [r] });
      return groups;
    }, new Map<string, { key: string; lat: number; lng: number; requests: typeof mappable }>()).values()
  ).map((group) => ({
    ...group,
    // The pin takes the colour of the most urgent request it stands for —
    // a critical case must not be hidden behind a low-urgency dot.
    // Urgency first, then recency: a donor opening a pin is triaging, and
    // between two Critical requests the newer one is the one still live.
    requests: [...group.requests].sort(
      (a, b) =>
        URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  }));

  // Re-center the map on the filtered wilaya's own hospitals instead of always
  // showing the Algiers view -- otherwise picking a distant wilaya leaves its
  // marker off-screen.
  const mapCenter: [number, number] =
    effectiveWilaya && mappable.length > 0
      ? [
          mappable.reduce((sum, r) => sum + r.hospitalLat, 0) / mappable.length,
          mappable.reduce((sum, r) => sum + r.hospitalLng, 0) / mappable.length,
        ]
      : ALGIERS_CENTER;
  const mapZoom = effectiveWilaya && mappable.length > 0 ? 12 : 11;

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          aria-label={t.backLabel}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.urgentRequests}</div>
            {/* Say so when these are the static rows rather than live ones.
                They name real hospitals at real coordinates and look freshly
                posted, so unlabelled they read as real pleas for blood. */}
            {isFallback && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "rgba(11,36,50,0.06)", color: "#8496A0" }}>
                {t.sampleData}
              </span>
            )}
          </div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.sortedDistance} · {bloodRequests.length} {t.nearby}</div>
        </div>
      </div>

      {wilayasPresent.length > 1 && (
        <div className="flex gap-2 mb-3.5 flex-wrap">
          {[null, ...wilayasPresent].map((w) => {
            const active = effectiveWilaya === w;
            return (
              <button
                key={w ?? "all"}
                onClick={() => { setSelectedWilaya(w); setSelectedCommune(null); }}
                className="cursor-pointer text-[12.5px] font-bold px-3.5 py-2 rounded-full border"
                style={
                  active
                    ? { background: accent, color: "#fff", borderColor: accent }
                    : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }
                }
              >
                {w ? wilayaLabel(w, lang) : t.filterAll}
              </button>
            );
          })}
        </div>
      )}

      {communesPresent.length > 1 && (
        <div className="relative mb-3">
          <select
            value={effectiveCommune ?? ""}
            onChange={(e) => setSelectedCommune(e.target.value || null)}
            aria-label={t.communeField}
            className="w-full h-11 rounded-[13px] border ps-3.5 pe-10 text-[13.5px] outline-none appearance-none bg-white"
            style={{ borderColor: "rgba(11,36,50,0.1)", color: "#0B2432", textAlign: "start" }}
          >
            <option value="">{t.allCommunes}</option>
            {communesPresent.map((c) => (
              <option key={c} value={c}>{communes ? communes.communeLabel(c, lang) : c}</option>
            ))}
          </select>
          {/* appearance-none removes the browser's own arrow and nothing had
              replaced it, so this read as a text box rather than a choice. */}
          <ChevronDown
            className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ insetInlineEnd: "14px", color: "#8496A0" }}
          />
        </div>
      )}

      {myType && (
        <div className="flex items-center gap-2 mb-3.5">
          <button
            onClick={() => setOnlyCanHelp((v) => !v)}
            aria-pressed={onlyCanHelp}
            className="cursor-pointer text-[12.5px] font-bold px-3.5 py-2 rounded-full border"
            style={onlyCanHelp
              ? { background: "#12B76A", color: "#fff", borderColor: "#12B76A" }
              : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }}
          >
            {t.canHelpFilter} · {canHelpCount}
          </button>
        </div>
      )}

      {onlyCanHelp && bloodRequests.length === 0 && (
        <div className="bg-white border rounded-[20px] p-5 mb-3.5 text-[13px]" style={{ borderColor: "rgba(11,36,50,0.06)", color: "#6B7C88", textAlign: "start" }}>
          {t.canHelpNone}
        </div>
      )}

      {/*
        The map is an enhancement, not a fixture.

        Coordinates come from the hospital directory, which covers 12 of 58
        wilayas — so in the other 46 there is nothing to plot. Rendering an
        empty grey rectangle there would tell a donor in Tissemsilt that
        something is broken, when in fact the list below is the whole product.
        The slot is removed, not emptied, and returns wherever coordinates
        exist.
      */}
      {markerGroups.length > 0 && (
        <Suspense
          fallback={
            <div
              className="rounded-[22px] h-[220px] border"
              style={{ borderColor: "rgba(11,36,50,0.08)", background: "#EAF0F2" }}
            />
          }
        >
          <RequestsMap
            groups={markerGroups}
            center={mapCenter}
            zoom={mapZoom}
            mapKey={effectiveWilaya ?? "all"}
            accent={accent}
            nearbyCount={bloodRequests.length}
            onOpenDetail={onOpenDetail}
          />
        </Suspense>
      )}

      {/* request list */}
      <div className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {loading && [0, 1, 2].map((i) => <RequestCardSkeleton key={`sk-${i}`} />)}
        {!loading && bloodRequests.map((r) => {
          const badge = urgencyStyle[r.urgency];
          return (
            <button
              key={r.id}
              data-testid="request-card"
              onClick={() => onOpenDetail(r)}
              // A column, with the footer on the bottom edge. A button centres
              // its content vertically, so in a row of two the shorter card sat
              // lower than its neighbour and the footers did not line up.
              className="cursor-pointer text-left w-full border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)] flex flex-col"
              style={{ borderColor: "rgba(11,36,50,0.06)", animation: "waRise .4s ease both", textAlign: "start" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-[13px] min-w-0">
                  <span
                    className="w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 shadow-[0_8px_16px_-8px_rgba(229,72,77,0.7)]"
                    style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
                  >
                    <Droplet className="w-6 h-6" fill="white" stroke="none" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15.5px] font-bold" style={{ color: "#0B2432" }}>{hospitalLabel(r.hospital, t)}</div>
                    {/* "CHU Frantz Fanon – Blida" followed by "Blida" is a
                        stutter, so the second one goes — and the pin with it,
                        since a location marker in front of a timestamp points
                        at nothing. */}
                    <div className="flex items-center gap-1 mt-0.5 text-[12.5px]" style={{ color: "#8496A0" }}>
                      {!nameStatesWilaya(r.hospital, r.wilaya) && (
                        <>
                          <MapPin className="w-[13px] h-[13px]" />
                          {wilayaLabel(r.wilaya, lang)} ·{" "}
                        </>
                      )}
                      {formatRelativeTime(r.createdAt, lang)}
                    </div>
                    {r.verifiedByName && (
                      <div className="mt-1.5">
                        <VerifiedBadge associationName={r.verifiedByName} variant="compact" />
                      </div>
                    )}
                    {/* Two different facts, and the donor's own commitment wins
                        the space: "you're going" answers "have I dealt with
                        this", which is what someone scanning a list is asking.
                        The count answers "am I still needed". */}
                    {goingTo.has(r.id) ? (
                      <div className="mt-1.5 flex items-center gap-1 text-[12px] font-bold" style={{ color: "#0E7A4B" }}>
                        <Check className="w-[13px] h-[13px]" strokeWidth={3} />
                        {t.youAreGoing}
                      </div>
                    ) : (counts[r.id] ?? 0) > 0 ? (
                      <PledgeBar pledged={counts[r.id] ?? 0} needed={r.units} variant="compact" />
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>
              <div className="mt-auto pt-3.5 flex items-center gap-2.5">
                <BloodType value={r.bloodType} className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t, lang)}</span>
                <span className="ms-auto text-[13px] font-extrabold" style={{ color: accent }}>{t.view} →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
