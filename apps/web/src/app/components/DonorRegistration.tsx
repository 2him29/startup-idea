import { useState } from "react";
import { ArrowLeft, Droplet, Check } from "lucide-react";
import { upsertDonorProfile } from "@weare/core";

interface DonorRegistrationProps {
  onBack: () => void;
  onComplete: () => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function DonorRegistration({ onBack, onComplete }: DonorRegistrationProps) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedBlood, setSelectedBlood] = useState("A+");
  const [medicallyEligible, setMedicallyEligible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = medicallyEligible && agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await upsertDonorProfile({
        bloodType: selectedBlood,
        age: age ? Number(age) : null,
        weightKg: weight ? Number(weight) : null,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your details, try again");
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>Become a donor</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>Takes about 2 minutes</div>
        </div>
      </div>

      <div className="rounded-2xl px-4 py-3.5 flex gap-[11px] items-start" style={{ background: "#FFECEC", border: "1px solid #FBD3D3" }}>
        <Droplet className="w-[19px] h-[19px] shrink-0 mt-0.5" style={{ color: "#E5484D" }} fill="#E5484D" />
        <span className="text-[13px] leading-relaxed" style={{ color: "#8A3438" }}>
          Your details help us match you with patients in need. Everything stays confidential.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-[18px] bg-white border rounded-[20px] p-[18px] shadow-[0_10px_24px_-20px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <div className="text-sm font-extrabold mb-3.5" style={{ color: "#0B2432" }}>Personal information</div>

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>Full name</label>
          <input
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
            style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>Age</label>
              <input
                placeholder="28"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
                style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>Weight (kg)</label>
              <input
                placeholder="70"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
                style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
              />
            </div>
          </div>

          <label className="block text-[12.5px] font-bold mb-2.5" style={{ color: "#5A6B75" }}>Blood type</label>
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
        </div>

        <div className="mt-3.5 bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <div className="text-sm font-extrabold mb-3.5" style={{ color: "#0B2432" }}>Eligibility</div>
          <label className="flex gap-3 items-start cursor-pointer">
            <span
              onClick={(e) => { e.preventDefault(); setMedicallyEligible((v) => !v); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-px"
              style={{ background: medicallyEligible ? "#12B76A" : "#EEF2F3", border: medicallyEligible ? "none" : "1.5px solid rgba(11,36,50,0.15)" }}
            >
              {medicallyEligible && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-relaxed" style={{ color: "#0B2432" }}>
              I'm in good health, weigh 50kg+, and I'm 18–65 years old.
            </span>
          </label>
          <div className="h-3" />
          <label className="flex gap-3 items-start cursor-pointer">
            <span
              onClick={(e) => { e.preventDefault(); setAgreedToTerms((v) => !v); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-px"
              style={{ background: agreedToTerms ? "#12B76A" : "#EEF2F3", border: agreedToTerms ? "none" : "1.5px solid rgba(11,36,50,0.15)" }}
            >
              {agreedToTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-relaxed" style={{ color: "#0B2432" }}>
              I agree to the terms and privacy policy.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
          style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
        >
          {submitting ? "Saving…" : "Complete registration"}
        </button>
      </form>
    </div>
  );
}
