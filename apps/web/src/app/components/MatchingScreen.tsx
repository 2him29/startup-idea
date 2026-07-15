import { useState } from "react";
import { ArrowLeft, MapPin, Droplet } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { unitsLabel, urgencyStyle, urgencyLabel, useBloodRequests, wilayaLabel, type BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { getDefaultWilaya } from "../prefs";

interface MatchingScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
  onOpenDetail: (request: BloodRequest) => void;
}

const ALGIERS_CENTER: [number, number] = [36.7755, 3.0597];

function urgencyIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(11,36,50,0.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function MatchingScreen({ onBack, userType, onOpenDetail }: MatchingScreenProps) {
  const { t, lang, dir } = useI18n();
  const accent = userType === "hospital" ? "#0E8BA8" : "#E5484D";
  const { requests: allRequests } = useBloodRequests();
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
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
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

      {/* map */}
      <div className="rounded-[22px] overflow-hidden h-[220px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
        <MapContainer key={effectiveWilaya ?? "all"} center={mapCenter} zoom={mapZoom} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mappable.map((r) => (
            <Marker key={r.id} position={[r.hospitalLat, r.hospitalLng]} icon={urgencyIcon(urgencyStyle[r.urgency].bg)}>
              <Popup>
                <div className="min-w-[150px]">
                  <div className="text-[13px] font-bold" style={{ color: "#0B2432" }}>{r.hospital}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                      style={{ background: urgencyStyle[r.urgency].bg, color: urgencyStyle[r.urgency].fg }}
                    >
                      {urgencyLabel(r.urgency, t)}
                    </span>
                    <span className="text-[11px]" style={{ color: "#6B7C88" }}>{r.bloodType} · {r.distance}</span>
                  </div>
                  <button
                    onClick={() => onOpenDetail(r)}
                    className="cursor-pointer mt-1.5 text-[12px] font-extrabold"
                    style={{ color: accent }}
                  >
                    {t.view} →
                  </button>
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

      {/* request list */}
      <div className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {bloodRequests.map((r) => {
          const badge = urgencyStyle[r.urgency];
          return (
            <button
              key={r.id}
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
                    <div className="flex items-center gap-1 mt-0.5 text-[12.5px]" style={{ color: "#8496A0" }}>
                      <MapPin className="w-[13px] h-[13px]" />
                      {r.distance} · {r.time}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-2.5">
                <span className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t)}</span>
                <span className="ms-auto text-[13px] font-extrabold" style={{ color: accent }}>{t.view} →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
