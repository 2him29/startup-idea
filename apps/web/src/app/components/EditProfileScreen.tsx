import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import {
  getDonorProfile,
  updateProfileDetails,
  updateOwnedHospital,
  upsertDonorProfile,
  WILAYAS,
  type Profile,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface EditProfileScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
  profile: Profile | null;
  onSaved: () => Promise<void>;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function EditProfileScreen({ onBack, userType, profile, onSaved }: EditProfileScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const isDonor = userType === "donor";

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [wilaya, setWilaya] = useState(profile?.wilaya ?? "");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedBlood, setSelectedBlood] = useState("A+");
  const [lastDonation, setLastDonation] = useState("");
  const [loading, setLoading] = useState(isDonor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDonor) return;
    let cancelled = false;
    getDonorProfile()
      .then((d) => {
        if (cancelled || !d) return;
        setSelectedBlood(d.bloodType);
        setAge(d.age != null ? String(d.age) : "");
        setWeight(d.weightKg != null ? String(d.weightKg) : "");
        setLastDonation(d.lastDonationDate ?? "");
      })
      .catch((err) => console.error("Failed to load donor profile", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDonor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfileDetails({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        wilaya: wilaya || null,
      });
      if (isDonor) {
        await upsertDonorProfile({
          bloodType: selectedBlood,
          age: age ? Number(age) : null,
          weightKg: weight ? Number(weight) : null,
          lastDonationDate: lastDonation || null,
        });
      } else {
        await updateOwnedHospital({ name: fullName.trim(), wilaya: wilaya || null });
      }
      await onSaved();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;
  const labelCls = "block text-[12.5px] font-bold mb-1.5";
  const labelStyle = { color: "#5A6B75", textAlign: "start" } as const;

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
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.editProfile}</div>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "#8496A0" }}>…</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_24px_-20px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <div className="text-sm font-extrabold mb-3.5" style={{ color: "#0B2432", textAlign: "start" }}>{t.personalInfo}</div>

            <label className={labelCls} style={labelStyle}>{isDonor ? t.fullName : t.hospitalLabel}</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
              style={{ ...inputStyle, textAlign: "start" }}
            />

            <label className={labelCls} style={labelStyle}>{t.phoneLabel}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05 XX XX XX XX"
              className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
              style={{ ...inputStyle, textAlign: "start", direction: "ltr" }}
            />

            <label className={labelCls} style={labelStyle}>{t.wilayaField}</label>
            <div className="relative mb-3.5">
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none appearance-none"
                style={{ ...inputStyle, textAlign: "start" }}
              >
                <option value="">—</option>
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.fr}>
                    {w.code} — {w[lang]}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ insetInlineEnd: "14px", color: "#8496A0" }}
              />
            </div>

            {isDonor && (
              <>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className={labelCls} style={labelStyle}>{t.age}</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
                      style={{ ...inputStyle, textAlign: "start" }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelCls} style={labelStyle}>{t.weight}</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
                      style={{ ...inputStyle, textAlign: "start" }}
                    />
                  </div>
                </div>

                <label className={labelCls} style={labelStyle}>{t.lastDonationLabel}</label>
                <input
                  type="date"
                  value={lastDonation}
                  onChange={(e) => setLastDonation(e.target.value)}
                  className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-4"
                  style={{ ...inputStyle, textAlign: "start" }}
                />

                <label className="block text-[12.5px] font-bold mb-2.5" style={labelStyle}>{t.bloodType}</label>
                <div className="grid grid-cols-4 gap-2.5">
                  {bloodTypes.map((b) => {
                    const active = b === selectedBlood;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBlood(b)}
                        className="cursor-pointer h-[46px] rounded-[13px] text-[15px] font-extrabold border-[1.5px]"
                        style={{
                          background: active ? "#E5484D" : "#F7FAFB",
                          color: active ? "#FFFFFF" : "#0B2432",
                          borderColor: active ? "#E5484D" : "rgba(11,36,50,0.12)",
                        }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3" }}>
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ background: "#E7F8EF", color: "#12703E", border: "1px solid #BEEBD1" }}>
              <Check className="w-4 h-4" strokeWidth={3} />
              {t.changesSaved}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
            style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
          >
            {saving ? "…" : t.saveChanges}
          </button>
        </form>
      )}
    </div>
  );
}
