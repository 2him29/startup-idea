import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { signIn, signUpDonor, signUpHospital, type Profile } from "@weare/core";

interface AuthScreenProps {
  role: "donor" | "hospital";
  onBack: () => void;
  onAuthenticated: (profile: Profile) => void;
}

export function AuthScreen({ role, onBack, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = role === "hospital" ? "#0E8BA8" : "#E5484D";
  const gradient = role === "hospital"
    ? "linear-gradient(135deg,#0E8BA8,#23A6C4)"
    : "linear-gradient(135deg,#E5484D,#F4677E)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile =
        mode === "login"
          ? await signIn({ email, password })
          : role === "hospital"
          ? await signUpHospital({ hospitalName: name, email, password })
          : await signUpDonor({ fullName: name, email, password });
      onAuthenticated(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-5 pt-2 pb-[130px] md:flex md:flex-col md:items-center md:justify-center md:px-6 md:py-12"
      style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}
    >
      <div className="md:w-full md:max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432" }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>
            {mode === "signup" ? "Create account" : "Log in"}
          </div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>
            {role === "hospital" ? "Hospital account" : "Donor account"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_24px_-20px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {mode === "signup" && (
            <>
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>
                {role === "hospital" ? "Hospital name" : "Full name"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "hospital" ? "City General Hospital" : "John Doe"}
                required
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
                style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
              />
            </>
          )}

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
            style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
          />

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
          />
        </div>

        {error && (
          <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(0,0,0,0.3)]"
          style={{ background: gradient }}
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode((m) => (m === "signup" ? "login" : "signup"));
          }}
          className="cursor-pointer mt-3.5 w-full text-center text-[13.5px] font-semibold"
          style={{ color: accent }}
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </form>
      </div>
    </div>
  );
}
