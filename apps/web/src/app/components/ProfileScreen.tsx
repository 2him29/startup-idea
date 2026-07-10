import { useState } from "react";
import { ArrowLeft, Droplet, Heart, Award, Calendar, User, Settings, ChevronRight } from "lucide-react";

interface ProfileScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
}

const donationHistory = [
  { id: 1, location: "City General Hospital", date: "Mar 15, 2025", type: "Whole Blood", units: 1 },
  { id: 2, location: "Memorial Medical Center", date: "Dec 10, 2024", type: "Whole Blood", units: 1 },
  { id: 3, location: "St. Mary's Hospital", date: "Sep 5, 2024", type: "Platelets", units: 1 },
];

function ToggleRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between px-[15px] py-[15px]">
      <span className="text-sm font-semibold" style={{ color: "#0B2432" }}>{label}</span>
      <button
        onClick={() => setOn((v) => !v)}
        className="cursor-pointer w-11 h-[26px] rounded-full relative transition-colors"
        style={{ background: on ? "#12B76A" : "#D6DEE2" }}
      >
        <span
          className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
          style={{ [on ? "right" : "left"]: "3px" } as React.CSSProperties}
        />
      </button>
    </div>
  );
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
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
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>Profile</div>
      </div>

      <div
        className="rounded-3xl p-[22px] text-white flex items-center gap-4 shadow-[0_22px_40px_-22px_rgba(229,72,77,0.75)]"
        style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
      >
        <span
          className="w-[66px] h-[66px] rounded-full bg-white flex items-center justify-center text-2xl font-extrabold border-4"
          style={{ color: "#E5484D", borderColor: "rgba(255,255,255,0.35)" }}
        >
          JD
        </span>
        <div className="flex-1">
          <div className="text-xl font-extrabold">John Doe</div>
          <div className="text-[13px] opacity-90">john.doe@email.com</div>
          <span className="inline-block mt-2 text-xs font-extrabold bg-white/[0.22] border border-white/35 px-[11px] py-1 rounded-full">
            Blood type A+
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[11px] mt-4">
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Droplet className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#E5484D" }} fill="#E5484D" />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>12</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>Donations</div>
        </div>
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Heart className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#E5484D" }} fill="#E5484D" />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>36</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>Lives saved</div>
        </div>
        <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <Award className="w-[22px] h-[22px] mx-auto mb-1" style={{ color: "#F5871F" }} />
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>3</div>
          <div className="text-[11px] font-semibold" style={{ color: "#8496A0" }}>Badges</div>
        </div>
      </div>

      <div
        className="mt-4 rounded-2xl p-[18px] text-white flex items-center gap-[14px]"
        style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
      >
        <span className="w-[46px] h-[46px] rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Calendar className="w-[22px] h-[22px]" />
        </span>
        <div className="flex-1">
          <div className="text-[12.5px] opacity-90">Next eligible donation</div>
          <div className="text-[17px] font-extrabold">May 15, 2025</div>
        </div>
        <span className="text-xs font-extrabold bg-white/[0.22] px-[11px] py-1.5 rounded-full">Ready</span>
      </div>

      <div className="mt-5 text-[15px] font-extrabold mb-[11px]" style={{ color: "#0B2432" }}>Notifications</div>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div style={{ borderBottom: "1px solid rgba(11,36,50,0.05)" }}>
          <ToggleRow label="Urgent blood requests" defaultOn={true} />
        </div>
        <div style={{ borderBottom: "1px solid rgba(11,36,50,0.05)" }}>
          <ToggleRow label="Donation reminders" defaultOn={true} />
        </div>
        <ToggleRow label="Nearby hospitals" defaultOn={false} />
      </div>

      <div className="mt-5 text-[15px] font-extrabold mb-[11px]" style={{ color: "#0B2432" }}>Donation history</div>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        {donationHistory.map((h, i) => (
          <div
            key={h.id}
            className="flex items-center gap-[13px] px-[15px] py-3.5"
            style={i < donationHistory.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
          >
            <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
              <Droplet className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} fill="#E5484D" />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{h.location}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{h.date} · {h.type}</div>
            </div>
            <span className="text-xs font-bold" style={{ color: "#6B7C88" }}>{h.units}u</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-0.5">
        <button className="cursor-pointer w-full text-left border-none bg-transparent py-[15px] px-1 flex items-center gap-[13px]">
          <User className="w-5 h-5" style={{ color: "#E5484D" }} />
          <span className="flex-1 text-[15px] font-semibold" style={{ color: "#0B2432" }}>Edit profile</span>
          <ChevronRight className="w-[18px] h-[18px]" style={{ color: "#C0CCD2" }} />
        </button>
        <button className="cursor-pointer w-full text-left border-none bg-transparent py-[15px] px-1 flex items-center gap-[13px]">
          <Settings className="w-5 h-5" style={{ color: "#E5484D" }} />
          <span className="flex-1 text-[15px] font-semibold" style={{ color: "#0B2432" }}>Settings</span>
          <ChevronRight className="w-[18px] h-[18px]" style={{ color: "#C0CCD2" }} />
        </button>
        <button className="cursor-pointer w-full text-left border-none bg-transparent py-[15px] px-1 text-[15px] font-bold" style={{ color: "#E5484D" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
