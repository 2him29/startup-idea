import { Droplet, Users, Bell, ShieldCheck, ChevronRight, Calendar, Award } from "lucide-react";
import { Logo } from "./Logo";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
  onSetUserType: (type: "donor" | "hospital") => void;
}

export function HomeScreen({ onNavigate, userType, onSetUserType }: HomeScreenProps) {
  if (!userType) {
    return (
      <div
        className="flex flex-col min-h-screen p-6 pb-8"
        style={{ background: "radial-gradient(130% 90% at 50% -10%, #FFE1E0 0%, #FFF3F2 40%, #F4FBFC 100%)" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className="w-[82px] h-[82px] rounded-[26px] bg-white flex items-center justify-center shadow-[0_18px_40px_-14px_rgba(229,72,77,0.5)]"
            style={{ animation: "waPop .5s ease both" }}
          >
            <Logo size={46} />
          </div>
          <h1 className="mt-[22px] text-[38px] font-extrabold tracking-[-1.2px]" style={{ color: "#0B2432" }}>
            We<span style={{ color: "#E5484D" }}>Are</span>
          </h1>
          <p className="mt-[10px] text-base leading-relaxed max-w-[260px]" style={{ color: "#5A6B75" }}>
            Every drop connects a life. Match donors and hospitals in real time.
          </p>

          <div className="w-full mt-[34px] flex flex-col gap-3.5">
            <button
              onClick={() => onSetUserType("donor")}
              className="cursor-pointer text-left p-5 rounded-[24px] text-white flex items-center gap-4 shadow-[0_20px_34px_-16px_rgba(229,72,77,0.7)]"
              style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
            >
              <span className="w-[52px] h-[52px] rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Droplet className="w-[26px] h-[26px]" fill="white" />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold">I'm a Donor</span>
                <span className="block text-[13.5px] opacity-90 mt-0.5">Give blood, save up to 3 lives</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>

            <button
              onClick={() => onSetUserType("hospital")}
              className="cursor-pointer text-left p-5 rounded-[24px] bg-white flex items-center gap-4 shadow-[0_16px_30px_-18px_rgba(14,139,168,0.55)] border-[1.5px]"
              style={{ color: "#0B2432", borderColor: "#DDEFF3" }}
            >
              <span className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Users className="w-[26px] h-[26px]" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold">I'm a Hospital</span>
                <span className="block text-[13.5px] mt-0.5" style={{ color: "#6B7C88" }}>Request units, find donors fast</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#0E8BA8" }} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-[12.5px] font-semibold" style={{ color: "#8496A0" }}>
          <ShieldCheck className="w-[15px] h-[15px]" style={{ color: "#12B76A" }} />
          HIPAA-safe · Trusted by 40+ hospitals
        </div>
      </div>
    );
  }

  const isDonor = userType === "donor";

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      {/* header */}
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-xl font-extrabold tracking-[-0.5px]" style={{ color: "#0B2432" }}>
            We<span style={{ color: isDonor ? "#E5484D" : "#0E8BA8" }}>Are</span>
          </span>
        </div>
        <button className="relative w-11 h-11 rounded-[14px] border bg-white flex items-center justify-center shadow-[0_6px_14px_-8px_rgba(11,36,50,0.3)]" style={{ borderColor: "rgba(11,36,50,0.08)" }}>
          <Bell className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
          <span className="absolute top-[9px] right-[10px] w-[9px] h-[9px] rounded-full bg-[#E5484D] border-2 border-white" />
        </button>
      </div>

      {isDonor ? (
        <div>
          {/* hero */}
          <div
            className="rounded-[26px] p-[22px] text-white relative overflow-hidden shadow-[0_22px_40px_-20px_rgba(229,72,77,0.8)]"
            style={{ background: "linear-gradient(135deg,#E5484D 0%, #F4677E 100%)" }}
          >
            <Droplet className="absolute -right-6 -top-6 opacity-[0.16]" style={{ width: 150, height: 150 }} fill="white" stroke="none" />
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] opacity-90 font-semibold">Welcome back,</span>
                <div className="text-2xl font-extrabold tracking-[-0.5px]">John Doe</div>
              </div>
              <span className="bg-white/[0.22] border border-white/35 px-3 py-1.5 rounded-xl font-extrabold text-[15px]">A+</span>
            </div>
            <div className="mt-[18px] bg-white/[0.16] rounded-2xl px-[15px] py-[13px] flex items-center gap-[13px]">
              <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
                <Droplet className="w-[22px] h-[22px]" style={{ color: "#E5484D" }} fill="#E5484D" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">You're eligible to donate</div>
                <div className="text-[12.5px] opacity-90">Last donation 58 days ago</div>
              </div>
              <span className="w-[11px] h-[11px] rounded-full bg-[#7BE3A6] shadow-[0_0_0_4px_rgba(123,227,166,0.3)]" />
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-[11px] mt-4">
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#E5484D" }}>12</div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>Donations</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#E5484D" }}>36</div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>Lives saved</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center shadow-[0_8px_18px_-14px_rgba(11,36,50,0.4)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#F5871F" }}>6</div>
              <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: "#6B7C88" }}>Streak</div>
            </div>
          </div>

          {/* urgent banner */}
          <button
            onClick={() => onNavigate("matching")}
            className="cursor-pointer text-left w-full mt-4 rounded-[20px] px-[18px] py-4 text-white flex items-center gap-[14px]"
            style={{ background: "linear-gradient(135deg,#2B1416,#3a1a1d)", animation: "waPulse 2.4s infinite" }}
          >
            <span className="w-[42px] h-[42px] rounded-xl bg-[#E5484D] flex items-center justify-center shrink-0">
              <Droplet className="w-[22px] h-[22px]" fill="white" stroke="none" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-bold">Critical A+ request nearby</span>
              <span className="block text-[12.5px] opacity-85 mt-px">City General · 2.3 km · needs 2 units</span>
            </span>
            <span className="text-xs font-extrabold bg-[#E5484D] px-[11px] py-1.5 rounded-full">Respond</span>
          </button>

          {/* quick actions */}
          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Quick actions</div>
          <div className="mt-3 flex flex-col gap-[11px]">
            <button
              onClick={() => onNavigate("matching")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
                <Droplet className="w-[21px] h-[21px]" style={{ color: "#E5484D" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>Find urgent requests</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>3 near you right now</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2" }} />
            </button>
            <button
              onClick={() => onNavigate("donor-registration")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Calendar className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>Schedule a donation</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>Book your next appointment</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2" }} />
            </button>
          </div>

          {/* recent */}
          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Recent activity</div>
          <div className="mt-3 bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <div className="flex items-center gap-[13px] px-[15px] py-3.5 border-b" style={{ borderColor: "rgba(11,36,50,0.05)" }}>
              <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: "#FFECEC" }}>
                <Droplet className="w-[18px] h-[18px]" style={{ color: "#E5484D" }} fill="#E5484D" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Donation completed</div>
                <div className="text-xs" style={{ color: "#8496A0" }}>City General · 2 days ago</div>
              </div>
              <span className="text-xs font-bold" style={{ color: "#12B76A" }}>+3 lives</span>
            </div>
            <div className="flex items-center gap-[13px] px-[15px] py-3.5">
              <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: "#FFF3E0" }}>
                <Award className="w-[18px] h-[18px]" style={{ color: "#F5871F" }} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Earned "Regular" badge</div>
                <div className="text-xs" style={{ color: "#8496A0" }}>1 week ago</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="rounded-[26px] p-[22px] text-white relative overflow-hidden shadow-[0_22px_40px_-20px_rgba(14,139,168,0.75)]"
            style={{ background: "linear-gradient(135deg,#0E8BA8 0%, #23A6C4 100%)" }}
          >
            <Users className="absolute -right-5 -top-5 opacity-[0.15]" style={{ width: 140, height: 140 }} stroke="white" fill="none" strokeWidth={1.5} />
            <span className="text-[13px] opacity-90 font-semibold">Signed in as</span>
            <div className="text-[22px] font-extrabold tracking-[-0.4px]">City General Hospital</div>
            <div className="mt-4 flex gap-2.5">
              <div className="flex-1 bg-white/[0.16] rounded-[14px] px-[13px] py-[11px]">
                <div className="text-[22px] font-extrabold">8</div>
                <div className="text-[11.5px] opacity-90">Active requests</div>
              </div>
              <div className="flex-1 bg-white/[0.16] rounded-[14px] px-[13px] py-[11px]">
                <div className="text-[22px] font-extrabold">14</div>
                <div className="text-[11.5px] opacity-90">Donors matched</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[11px] mt-4">
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#0E8BA8" }}>156</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>Total</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#12B76A" }}>8</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>Active</div>
            </div>
            <div className="bg-white border rounded-2xl p-3.5 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
              <div className="text-[23px] font-extrabold" style={{ color: "#E5484D" }}>2</div>
              <div className="text-[11px] font-semibold" style={{ color: "#6B7C88" }}>Critical</div>
            </div>
          </div>

          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Quick actions</div>
          <div className="mt-3 flex flex-col gap-[11px]">
            <button
              onClick={() => onNavigate("hospital")}
              className="cursor-pointer text-left w-full rounded-2xl p-4 text-white flex items-center gap-[14px] shadow-[0_16px_28px_-18px_rgba(14,139,168,0.9)]"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
            >
              <span className="w-11 h-11 rounded-[13px] bg-white/20 flex items-center justify-center shrink-0">
                <Droplet className="w-[21px] h-[21px]" />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold">View blood requests</span>
                <span className="block text-[12.5px] opacity-90">Manage all open requests</span>
              </span>
              <span className="text-xs font-extrabold bg-white/[0.22] px-2.5 py-1 rounded-full">8</span>
            </button>
            <button
              onClick={() => onNavigate("matching")}
              className="cursor-pointer text-left w-full border rounded-2xl p-[15px] bg-white flex items-center gap-[14px] shadow-[0_8px_18px_-16px_rgba(11,36,50,0.5)]"
              style={{ borderColor: "rgba(11,36,50,0.06)" }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
                <Users className="w-[21px] h-[21px]" style={{ color: "#0E8BA8" }} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold" style={{ color: "#0B2432" }}>Find donors</span>
                <span className="block text-[12.5px]" style={{ color: "#6B7C88" }}>Search available donors nearby</span>
              </span>
              <ChevronRight className="w-[19px] h-[19px]" style={{ color: "#C0CCD2" }} />
            </button>
          </div>

          <div className="mt-[22px] text-base font-extrabold" style={{ color: "#0B2432" }}>Recent matches</div>
          <div className="mt-3 bg-white border rounded-2xl px-[15px] py-3.5 flex items-center gap-[13px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <span
              className="w-[38px] h-[38px] rounded-full text-white flex items-center justify-center font-extrabold text-sm"
              style={{ background: "linear-gradient(135deg,#0E8BA8,#12B76A)" }}
            >
              SJ
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: "#0B2432" }}>Sarah Johnson · A+</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>Confirmed · arriving 3:40 PM</div>
            </div>
            <span className="text-[11.5px] font-bold px-[9px] py-1 rounded-full" style={{ color: "#12B76A", background: "#E6F8EF" }}>Matched</span>
          </div>
        </div>
      )}
    </div>
  );
}
