import { useState } from "react";
import { ArrowLeft, Search, Navigation, Building2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useHospitals, openDirections, wilayaLabel } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { RequestRowSkeleton } from "./Skeletons";

interface HospitalsScreenProps {
  onBack: () => void;
}

const ALGERIA_CENTER: [number, number] = [34.6, 3.0];

const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:7px;background:#0E8BA8;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(11,36,50,0.45);display:flex;align-items:center;justify-content:center;">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M12 6v12M6 12h12"/></svg>
         </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Nationwide directory of Algeria's real public hospitals, each openable in Google Maps. */
export function HospitalsScreen({ onBack }: HospitalsScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const { hospitals, loading } = useHospitals();
  const [search, setSearch] = useState("");

  const located = hospitals.filter((h) => h.latitude != null && h.longitude != null);
  const q = search.trim().toLowerCase();
  const filtered = located
    .filter(
      (h) =>
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.wilaya ?? "").toLowerCase().includes(q) ||
        wilayaLabel(h.wilaya, lang).toLowerCase().includes(q)
    )
    .sort((a, b) => (a.wilaya ?? "").localeCompare(b.wilaya ?? "") || a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen px-5 pt-2 pb-[40px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.hospitalsTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{filtered.length} · {t.hospitalsSub}</div>
        </div>
      </div>

      {/* nationwide map */}
      <div className="rounded-[22px] overflow-hidden h-[230px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
        <MapContainer center={ALGERIA_CENTER} zoom={5} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {located.map((h) => (
            <Marker key={h.id} position={[h.latitude!, h.longitude!]} icon={hospitalIcon}>
              <Popup>
                <div className="min-w-[170px]">
                  <div className="text-[13px] font-bold" style={{ color: "#0B2432" }}>{h.name}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "#6B7C88" }}>{wilayaLabel(h.wilaya, lang)}</div>
                  <button
                    onClick={() => openDirections({ lat: h.latitude, lng: h.longitude, name: h.name })}
                    className="cursor-pointer mt-1.5 text-[12px] font-extrabold border-none bg-transparent p-0"
                    style={{ color: "#0E8BA8" }}
                  >
                    {t.openInMaps} →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* search */}
      <div className="relative mt-4 mb-3.5">
        <Search className="absolute start-[15px] top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "#9AA9B2" }} />
        <input
          placeholder={t.hospSearchPh}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 rounded-2xl border-[1.5px] bg-white ps-[42px] pe-3.5 text-sm outline-none"
          style={{ borderColor: "rgba(11,36,50,0.1)", color: "#0B2432", textAlign: "start" }}
        />
      </div>

      {/* directory list */}
      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-3.5">
        {loading && [0, 1, 2, 3].map((i) => (
          <div key={`sk-${i}`} className="bg-white border rounded-[18px] p-3.5" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <RequestRowSkeleton />
          </div>
        ))}
        {!loading && filtered.map((h, i) => (
          <div
            key={h.id}
            className="bg-white border rounded-[18px] p-3.5 flex items-center gap-3 shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
            style={{ borderColor: "rgba(11,36,50,0.06)", animation: `waRise .35s ease ${Math.min(i * 40, 400)}ms both` }}
          >
            <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
              <Building2 className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} />
            </span>
            <span className="flex-1 min-w-0" style={{ textAlign: "start" }}>
              <span className="block text-[14px] font-bold leading-snug" style={{ color: "#0B2432" }}>{h.name}</span>
              <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EEF4F6", color: "#5A6B75" }}>
                {wilayaLabel(h.wilaya, lang)}
              </span>
            </span>
            <button
              onClick={() => openDirections({ lat: h.latitude, lng: h.longitude, name: h.name })}
              title={t.openInMaps}
              aria-label={t.openInMaps}
              className="cursor-pointer w-11 h-11 rounded-[13px] border-none flex items-center justify-center shrink-0 text-white shadow-[0_10px_20px_-10px_rgba(14,139,168,0.9)]"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
            >
              <Navigation className="w-[19px] h-[19px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
