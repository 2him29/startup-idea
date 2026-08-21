import { useEffect, useState } from "react";
import { BadgeCheck, Droplet, MapPin } from "lucide-react";
import { fetchPublicStats, type PublicStats } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

/**
 * The state of the network, on the splash, from the database.
 *
 * The screen below this used to end in empty space, and the obvious way to
 * fill it is a photograph. Numbers do it better: they are the one thing on a
 * landing page that cannot be mocked up, they restate the tagline's claim of
 * "in real time" as evidence rather than assertion, and anyone doubting them
 * can press reload.
 *
 * Renders nothing at all until the numbers arrive, and nothing ever if they
 * do not. A stat strip reading "0 open requests" would be a bleak and probably
 * false claim; absence is merely quiet, and the splash is complete without it.
 */
export function LiveStats() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicStats().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  // Intl, not template strings: Arabic uses its own digits, and a hand-built
  // "10" would sit in a sentence that reads right to left around it.
  const n = (value: number) => new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : lang).format(value);

  const items = [
    { icon: Droplet, value: stats.openRequests, label: t.statsOpenNow, tone: "#E5484D", bg: "#FFECEC" },
    { icon: MapPin, value: stats.wilayas, label: t.statsAcrossWilayas, tone: "#0E8BA8", bg: "#E4F6FB" },
    { icon: BadgeCheck, value: stats.verified, label: t.statsVouched, tone: "#12B76A", bg: "#EAF6EF" },
  ];

  return (
    <div className="w-full md:max-w-4xl mt-7 md:mt-10" style={{ animation: "waRise .5s ease both" }}>
      <div className="flex items-center gap-2.5 mb-3 justify-center">
        {/* A quiet pulse, because the claim is that this is happening now. */}
        <span className="relative flex w-2 h-2">
          <span
            className="absolute inline-flex w-full h-full rounded-full opacity-70"
            style={{ background: "#12B76A", animation: "waPulse 2s ease-in-out infinite" }}
          />
          <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#12B76A" }} />
        </span>
        <span className="text-[11.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: "#8496A0" }}>
          {t.statsLive}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        {items.map(({ icon: Icon, value, label, tone, bg }) => (
          <div
            key={label}
            className="rounded-[18px] md:rounded-2xl bg-white/70 border px-3 py-3.5 md:py-5 text-center"
            style={{ borderColor: "rgba(11,36,50,0.06)", backdropFilter: "blur(6px)" }}
          >
            <span
              className="w-8 h-8 md:w-9 md:h-9 rounded-[10px] mx-auto flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon className="w-[17px] h-[17px]" style={{ color: tone }} />
            </span>
            <div className="mt-2 text-[22px] md:text-[26px] font-extrabold leading-none" style={{ color: "#0B2432" }}>
              {n(value)}
            </div>
            <div className="mt-1 text-[11.5px] md:text-[12.5px] leading-snug" style={{ color: "#8496A0" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
