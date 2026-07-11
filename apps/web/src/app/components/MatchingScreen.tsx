import { ArrowLeft, MapPin, Droplet } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { unitsLabel, urgencyStyle, useBloodRequests, type BloodRequest } from "@weare/core";

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
  const accent = userType === "hospital" ? "#0E8BA8" : "#E5484D";
  const { requests: bloodRequests } = useBloodRequests();

  const mappable = bloodRequests.filter(
    (r): r is BloodRequest & { hospitalLat: number; hospitalLng: number } =>
      r.hospitalLat != null && r.hospitalLng != null
  );

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432" }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>Urgent requests</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>Sorted by distance · {bloodRequests.length} nearby</div>
        </div>
      </div>

      {/* map */}
      <div className="rounded-[22px] overflow-hidden h-[220px] relative border shadow-[0_12px_26px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
        <MapContainer center={ALGIERS_CENTER} zoom={11} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
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
                      {r.urgency}
                    </span>
                    <span className="text-[11px]" style={{ color: "#6B7C88" }}>{r.bloodType} · {r.distance}</span>
                  </div>
                  <button
                    onClick={() => onOpenDetail(r)}
                    className="cursor-pointer mt-1.5 text-[12px] font-extrabold"
                    style={{ color: accent }}
                  >
                    View →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute top-3 right-3 bg-white rounded-xl px-[11px] py-2 shadow-[0_6px_14px_-8px_rgba(11,36,50,0.5)]" style={{ zIndex: 1000 }}>
          <div className="text-xs font-extrabold" style={{ color: accent }}>Live map</div>
          <div className="text-[11px]" style={{ color: "#8496A0" }}>{bloodRequests.length} nearby</div>
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
              style={{ borderColor: "rgba(11,36,50,0.06)", animation: "waRise .4s ease both" }}
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
                  {r.urgency}
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-2.5">
                <span className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units)}</span>
                <span className="ml-auto text-[13px] font-extrabold" style={{ color: accent }}>View →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
