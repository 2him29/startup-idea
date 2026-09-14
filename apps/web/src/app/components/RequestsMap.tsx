import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { urgencyStyle, urgencyLabel, wilayaLabel, nameStatesWilaya, hospitalLabel, type BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";
import { VerifiedBadge } from "./VerifiedBadge";

/**
 * The pins on the Find screen, in a file of their own.
 *
 * Leaflet and its React bindings are 153 kB — a third of what the app used to
 * download before it could show anything — and this is the only reason they
 * are needed. Kept here, they arrive when a map is actually drawn: never on
 * the splash, and not at all in the 46 wilayas whose hospitals have no
 * coordinates, where the Find screen shows its list and no map.
 */
interface MarkerGroup {
  key: string;
  lat: number;
  lng: number;
  requests: BloodRequest[];
}

interface RequestsMapProps {
  groups: MarkerGroup[];
  center: [number, number];
  zoom: number;
  /** Remounts the map when the wilaya filter changes, so it re-centres. */
  mapKey: string;
  accent: string;
  nearbyCount: number;
  onOpenDetail: (request: BloodRequest) => void;
}

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

export default function RequestsMap({ groups, center, zoom, mapKey, accent, nearbyCount, onOpenDetail }: RequestsMapProps) {
  const { t, lang } = useI18n();

  return (
    <div className="rounded-[22px] overflow-hidden h-[220px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
      <MapContainer key={mapKey} center={center} zoom={zoom} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groups.map((group) => (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={urgencyIcon(urgencyStyle[group.requests[0].urgency].bg, group.requests.length)}
          >
            <Popup>
              <div className="min-w-[170px] max-h-[220px] overflow-y-auto">
                <div className="text-[13px] font-bold" style={{ color: "#0B2432" }}>
                  {hospitalLabel(group.requests[0].hospital, t)}
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
        <div className="text-[11px]" style={{ color: "#8496A0" }}>{nearbyCount} {t.nearby}</div>
      </div>
    </div>
  );
}
