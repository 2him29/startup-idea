import { useState } from "react";
import { ArrowLeft, Check, MapPin, Droplet } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { unitsLabel, urgencyStyle, urgencyLabel, useBloodRequests, useResponses, wilayaLabel, nameStatesWilaya, type BloodRequest, type Urgency, formatRelativeTime } from "@weare/core";
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

function urgencyIcon(color: string, count: number) {
  // The count rides on the pin because one hospital routinely holds several
  // requests — Blida has a single hospital in the directory — and a bare dot
  // gives a donor no reason to open it.
  const badge =
    count > 1
      ? `<span style="position:absolute;top:-6px;inset-inline-end:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#0B2432;color:#fff;font:700 10px/16px 'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;box-sizing:border-box">${count}</span>`
      : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(11,36,50,0.4)">${badge}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function MatchingScreen({ onBack, userType, onOpenDetail }: MatchingScreenProps) {
  const { t, lang, dir } = useI18n();
  const accent = userType === "hospital" ? "#0E8BA8" : "#E5484D";
  const { requests: allRequests, loading } = useBloodRequests();
  // Keyed off every request on screen, so the counts and the donor's own
  // commitments arrive in one pass rather than per card.
  const { goingTo, counts } = useResponses(allRequests.map((r) => r.id));
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const wilayasPresent = Array.from(new Set(allRequests.map((r) => r.wilaya).filter((w): w is string => !!w)));
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(() => getDefaultWilaya());
  // The saved preference may name a wilaya with no open requests right now --
  // fall back to showing everything rather than an empty list.
  const effectiveWilaya = selectedWilaya && wilayasPresent.includes(selectedWilaya) ? selectedWilaya : null;
  const bloodRequests = effectiveWilaya ? allRequests.filter((r) => r.wilaya === effectiveWilaya) : allRequests;

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
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.urgentRequests}</div>
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
                onClick={() => setSelectedWilaya(w)}
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
      <div className="rounded-[22px] overflow-hidden h-[220px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
        <MapContainer key={effectiveWilaya ?? "all"} center={mapCenter} zoom={mapZoom} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerGroups.map((group) => (
            <Marker
              key={group.key}
              position={[group.lat, group.lng]}
              icon={urgencyIcon(urgencyStyle[group.requests[0].urgency].bg, group.requests.length)}
            >
              <Popup>
                <div className="min-w-[170px] max-h-[220px] overflow-y-auto">
                  <div className="text-[13px] font-bold" style={{ color: "#0B2432" }}>
                    {group.requests[0].hospital}
                  </div>
                  {group.requests.length > 1 && (
                    <div className="text-[11px] mt-0.5" style={{ color: "#8496A0" }}>
                      {group.requests.length} {t.urgentRequests.toLowerCase()}
                    </div>
                  )}

                  {group.requests.map((r, i) => (
                    <div
                      key={r.id}
                      className="pt-1.5"
                      style={i > 0 ? { marginTop: "8px", borderTop: "1px solid rgba(11,36,50,0.08)" } : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Type first: a donor is scanning for their own blood
                            group, not for the hospital they already tapped. */}
                        <BloodType
                          value={r.bloodType}
                          className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg"
                          style={{ background: "#FFECEC", color: "#E5484D" }}
                        />
                        <span
                          className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                          style={{ background: urgencyStyle[r.urgency].bg, color: urgencyStyle[r.urgency].fg }}
                        >
                          {urgencyLabel(r.urgency, t)}
                        </span>
                        {!nameStatesWilaya(r.hospital, r.wilaya) && (
                          <span className="text-[11px]" style={{ color: "#6B7C88" }}>{wilayaLabel(r.wilaya, lang)}</span>
                        )}
                      </div>
                      {/* Same badge as the list below. A pin and a card are two
                          views of one request, so trust that shows in one and
                          not the other reads as the badge being unreliable. */}
                      {r.verifiedByName && (
                        <div className="mt-1.5">
                          <VerifiedBadge associationName={r.verifiedByName} variant="compact" />
                        </div>
                      )}
                      <button
                        onClick={() => onOpenDetail(r)}
                        className="cursor-pointer mt-1.5 text-[12px] font-extrabold"
                        style={{ color: accent }}
                      >
                        {t.view} →
                      </button>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute top-3 end-3 bg-white rounded-xl px-[11px] py-2 shadow-[0_6px_14px_-8px_rgba(11,36,50,0.5)]" style={{ zIndex: 1000 }}>
          <div className="text-xs font-extrabold" style={{ color: accent }}>{t.liveMap}</div>
          <div className="text-[11px]" style={{ color: "#8496A0" }}>{bloodRequests.length} {t.nearby}</div>
        </div>
      </div>
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
              className="cursor-pointer text-left w-full border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", animation: "waRise .4s ease both", textAlign: "start" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-[13px]">
                  <span
                    className="w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 shadow-[0_8px_16px_-8px_rgba(229,72,77,0.7)]"
                    style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
                  >
                    <Droplet className="w-6 h-6" fill="white" stroke="none" />
                  </span>
                  <div>
                    <div className="text-[15.5px] font-bold" style={{ color: "#0B2432" }}>{r.hospital}</div>
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
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-2.5">
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
