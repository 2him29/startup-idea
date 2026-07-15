import { useState } from "react";
import { LayoutDashboard, ClipboardList, Users, Package, Droplet, Printer, Download } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useBloodRequests, urgencyStyle, urgencyLabel, unitsLabel, RESERVE, RESERVE_STATUS, useSession, type BloodRequest, type Strings } from "@weare/core";
import { QatraMark, QatraWordmark } from "./QatraMark";
import { useI18n } from "../i18n/LangContext";
import { RequestRowSkeleton } from "./Skeletons";
import { NotificationsBell } from "./NotificationsBell";
import { NewRequestSheet } from "./NewRequestSheet";
import { useToast } from "./Toast";

function printRequests(requests: BloodRequest[], t: Strings, dir: "ltr" | "rtl") {
  const win = window.open("", "_blank");
  if (!win) return;
  const rows = requests
    .map(
      (r) =>
        `<tr><td>${r.patientId}</td><td>${r.hospital}</td><td>${r.bloodType}</td><td>${unitsLabel(r.units, t)}</td><td>${urgencyLabel(r.urgency, t)}</td><td>${r.time}</td></tr>`
    )
    .join("");
  win.document.write(`
    <html dir="${dir}">
      <head>
        <title>${t.openRequests}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; color: #0B2432; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { text-align: start; padding: 8px 10px; border-bottom: 1px solid #E2E8EA; font-size: 13px; }
          th { color: #6B7C88; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${t.openRequests}</h1>
        <table>
          <thead><tr><th>${t.requestedBy}</th><th>${t.hospitalLabel}</th><th>${t.bloodType}</th><th>${t.unitsNeeded}</th><th>${t.urgencyHeader}</th><th>${t.posted}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}

function exportRequestsCsv(requests: BloodRequest[], t: Strings) {
  const header = "Patient ID,Hospital,Blood Type,Units,Urgency,Time\n";
  const rows = requests
    .map((r) => [r.patientId, r.hospital, r.bloodType, r.units, urgencyLabel(r.urgency, t), r.time].join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blood_requests.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface HospitalConsoleProps {
  onBack: () => void;
}

const ALGIERS_CENTER: [number, number] = [36.7538, 3.06];

// Static sample points around Algiers standing in for "donors nearby" — no
// donor geolocation table exists yet, so this mirrors the design's own
// placeholder dots rather than inventing a live donor-tracking feature.
const DONOR_DOTS: { lat: number; lng: number; color: string }[] = [
  { lat: 36.7538, lng: 3.06, color: "#0E8BA8" },
  { lat: 36.77, lng: 3.03, color: "#12B76A" },
  { lat: 36.73, lng: 3.09, color: "#12B76A" },
  { lat: 36.76, lng: 3.1, color: "#F5871F" },
];

type Tab = "dashboard" | "requests" | "donors" | "reserve";

export function HospitalConsole({ onBack }: HospitalConsoleProps) {
  const { t, lang, dir } = useI18n();
  const { requests: bloodRequests, loading: requestsLoading, refresh } = useBloodRequests();
  const { profile } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sosActive, setSosActive] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);

  const criticalCount = bloodRequests.filter((r) => r.urgency === "Critical").length;
  const initial = profile?.fullName?.trim()?.[0]?.toUpperCase() ?? "H";

  const navItems: { id: Tab; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: t.dashboard },
    { id: "requests", icon: ClipboardList, label: t.requestsNav },
    { id: "donors", icon: Users, label: t.donorsNav },
    { id: "reserve", icon: Package, label: t.reserveNav },
  ];

  return (
    <div dir={dir} className="min-h-screen flex" style={{ fontFamily: "inherit" }}>
      {/* console sidebar */}
      <div
        className="w-[236px] shrink-0 flex flex-col p-[22px_16px] bg-white"
        style={{ borderInlineEnd: "1px solid rgba(11,36,50,0.07)" }}
      >
        <button
          onClick={onBack}
          className="cursor-pointer border-none bg-transparent flex items-center gap-2.5 px-2 mb-[26px]"
          style={{ textAlign: "start" }}
        >
          <QatraMark size={32} radius={10} />
          <QatraWordmark size={22} />
        </button>

        <div className="flex flex-col gap-[3px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="cursor-pointer border-none flex items-center gap-3 px-3 py-[11px] rounded-xl"
                style={{
                  background: isActive ? "#E4F6FB" : "transparent",
                  color: isActive ? "#0E8BA8" : "#5A6B75",
                  textAlign: "start",
                }}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className="mt-auto rounded-2xl p-[15px] text-white"
          style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
        >
          <div className="text-[13px] font-bold">{t.deskSosCta}</div>
          <div className="text-[11.5px] opacity-90 mt-[3px] leading-relaxed">{t.deskSosSub}</div>
          <button
            onClick={() => {
              toast(sosActive ? "info" : "success", sosActive ? t.sosStoppedToast : t.sosStartedToast);
              setSosActive(!sosActive);
            }}
            className="cursor-pointer mt-[11px] w-full h-[38px] rounded-[10px] border-none bg-white text-[13px] font-extrabold"
            style={{ color: "#0E8BA8" }}
          >
            {t.deskSosBtn}
          </button>
        </div>
      </div>

      {/* main */}
      <div className="flex-1 px-[30px] py-[26px] overflow-hidden" style={{ background: "linear-gradient(180deg,#F7FBFC,#FFFFFF)" }}>
        <div className="flex items-center justify-between mb-[22px]">
          <div>
            <div className="text-[23px] font-extrabold tracking-[-0.4px] whitespace-nowrap" style={{ color: "#0B2432" }}>{t.deskTitle}</div>
            <div className="text-[13px] mt-0.5" style={{ color: "#8496A0" }}>CHU Mustapha Pacha · Alger · {t.updatedNow}</div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell size={40} requests={bloodRequests} onOpen={() => setTab("requests")} />
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#12B76A)" }}
            >
              {initial}
            </span>
          </div>
        </div>

        {sosActive && (
          <div
            className="mb-[18px] rounded-2xl px-[18px] py-3.5 text-white flex items-center gap-[13px]"
            style={{ background: "linear-gradient(135deg,#2B1416,#3a1a1d)", animation: "waPulse 2.4s infinite" }}
          >
            <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#E5484D" }}>
              <Droplet className="w-5 h-5" fill="white" stroke="none" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold">{t.deskSosLive}</div>
              <div className="text-xs opacity-85">{t.deskSosLiveSub}</div>
            </div>
            <button
              onClick={() => {
                setSosActive(false);
                toast("info", t.sosStoppedToast);
              }}
              className="cursor-pointer text-xs font-bold px-[13px] py-[7px] rounded-full border bg-transparent text-white"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}
            >
              {t.dismiss}
            </button>
          </div>
        )}

        {/* stat row */}
        <div className="grid grid-cols-4 gap-3.5">
          <StatCard label={t.activeRequests} value={bloodRequests.length} color="#0E8BA8" />
          <StatCard label={t.critical} value={criticalCount} color="#E5484D" />
          <StatCard label={t.donorsMatched} value={14} color="#12B76A" />
          <StatCard label={t.fulfilled} value={132} color="#0B2432" />
        </div>

        {tab === "dashboard" && (
          <div className="grid gap-[18px] mt-[18px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <RequestsCard requests={bloodRequests} loading={requestsLoading} title={t.openRequests} viewAllLabel={t.viewAll} onViewAll={() => setTab("requests")} t={t} dir={dir} />
            <div className="flex flex-col gap-[18px]">
              <ReserveCard lang={lang} title={t.reserveTitle} />
              <DonorsMiniMap title={t.donorsNearby} compatibleLabel={t.compatibleDonors} />
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="mt-[18px]">
            <RequestsCard requests={bloodRequests} loading={requestsLoading} title={t.openRequests} viewAllLabel={t.newLabel} onViewAll={() => setShowNewRequest(true)} t={t} dir={dir} full />
          </div>
        )}

        {tab === "donors" && (
          <div className="mt-[18px]">
            <DonorsMiniMap title={t.donorsNearby} compatibleLabel={t.compatibleDonors} tall />
          </div>
        )}

        {tab === "reserve" && (
          <div className="mt-[18px] max-w-[520px]">
            <ReserveCard lang={lang} title={t.reserveTitle} />
          </div>
        )}

        {showNewRequest && <NewRequestSheet onClose={() => setShowNewRequest(false)} onPublished={refresh} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border rounded-[18px] p-4 shadow-[0_10px_22px_-18px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
      <div className="text-xs font-semibold" style={{ color: "#8496A0" }}>{label}</div>
      <div className="text-[28px] font-extrabold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function RequestsCard({
  requests,
  loading,
  title,
  viewAllLabel,
  onViewAll,
  t,
  dir,
  full,
}: {
  requests: ReturnType<typeof useBloodRequests>["requests"];
  loading: boolean;
  title: string;
  viewAllLabel: string;
  onViewAll: () => void;
  t: ReturnType<typeof useI18n>["t"];
  dir: ReturnType<typeof useI18n>["dir"];
  full?: boolean;
}) {
  return (
    <div
      className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_22px_-18px_rgba(11,36,50,0.5)]"
      style={{ borderColor: "rgba(11,36,50,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[15px] font-extrabold" style={{ color: "#0B2432" }}>{title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => printRequests(requests, t, dir)}
            title={t.printLabel}
            className="cursor-pointer w-8 h-8 rounded-lg border-none bg-transparent flex items-center justify-center"
            style={{ color: "#8496A0" }}
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportRequestsCsv(requests, t)}
            title={t.exportLabel}
            className="cursor-pointer w-8 h-8 rounded-lg border-none bg-transparent flex items-center justify-center"
            style={{ color: "#8496A0" }}
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onViewAll} className="cursor-pointer border-none bg-transparent text-xs font-bold ms-1" style={{ color: "#0E8BA8" }}>{viewAllLabel}</button>
        </div>
      </div>
      <div className={full ? "grid grid-cols-2 gap-x-6" : "flex flex-col"}>
        {loading && [0, 1, 2, 3].map((i) => <RequestRowSkeleton key={`sk-${i}`} />)}
        {!loading && requests.map((r) => {
          const badge = urgencyStyle[r.urgency];
          return (
            <div key={r.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid rgba(11,36,50,0.05)" }}>
              <span className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
                <Droplet className="w-[19px] h-[19px]" fill="#E5484D" stroke="none" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-bold truncate" style={{ color: "#0B2432" }}>{r.patientId}</div>
                <div className="text-xs truncate" style={{ color: "#8496A0" }}>{r.hospital}</div>
              </div>
              <span className="font-extrabold text-[12.5px] px-2.5 py-1.5 rounded-[9px]" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
              <span className="text-xs font-semibold w-14 text-center" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t)}</span>
              <span className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-full whitespace-nowrap" style={{ background: badge.bg, color: badge.fg }}>
                {urgencyLabel(r.urgency, t)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReserveCard({ lang, title }: { lang: "en" | "fr" | "ar"; title: string }) {
  return (
    <div
      className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_22px_-18px_rgba(11,36,50,0.5)]"
      style={{ borderColor: "rgba(11,36,50,0.06)" }}
    >
      <div className="text-[15px] font-extrabold mb-3.5" style={{ color: "#0B2432" }}>{title}</div>
      <div className="flex flex-col gap-3">
        {RESERVE.map((b) => (
          <div key={b.type} className="flex items-center gap-[11px]">
            <span className="w-[38px] text-[13.5px] font-extrabold" style={{ color: "#0B2432" }}>{b.type}</span>
            <div className="flex-1 h-2 rounded-md overflow-hidden" style={{ background: "#EEF2F4" }}>
              <div className="h-full rounded-md" style={{ width: b.width, background: b.color }} />
            </div>
            <span className="text-[11px] font-bold w-[58px]" style={{ color: b.color, textAlign: "end" }}>
              {RESERVE_STATUS[lang][b.statusKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonorsMiniMap({ title, compatibleLabel, tall }: { title: string; compatibleLabel: string; tall?: boolean }) {
  return (
    <div
      className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_22px_-18px_rgba(11,36,50,0.5)]"
      style={{ borderColor: "rgba(11,36,50,0.06)" }}
    >
      <div className="text-[15px] font-extrabold mb-3" style={{ color: "#0B2432" }}>{title}</div>
      <div
        className="rounded-2xl overflow-hidden relative border"
        style={{ height: tall ? 360 : 150, borderColor: "rgba(11,36,50,0.06)" }}
      >
        <MapContainer center={ALGIERS_CENTER} zoom={12} scrollWheelZoom={false} dragging={false} style={{ width: "100%", height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {DONOR_DOTS.map((d, i) => (
            <CircleMarker key={i} center={[d.lat, d.lng]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: d.color, fillOpacity: 1 }} />
          ))}
        </MapContainer>
      </div>
      <div className="mt-3 text-[12.5px] font-semibold" style={{ color: "#6B7C88" }}>12 {compatibleLabel} · Alger-Centre</div>
    </div>
  );
}
