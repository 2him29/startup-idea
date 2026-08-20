import { useEffect, useState } from "react";
import { CheckCircle2, FileText, MapPin, Phone, ShieldAlert, User } from "lucide-react";
import { fetchRequestPlausibility, type RequestPlausibility } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

/**
 * The material a committee actually weighs before vouching.
 *
 * The console used to lead with the hospital, but nobody vouches for a
 * hospital — the question is whether this particular plea is real. That is
 * answered by who posted it, whether they can be reached, whether they had the
 * hospital's file number to hand, and whether the hospital is one we know.
 *
 * Fetched only when opened, and only for one request at a time. It reaches
 * into `profiles` through a SECURITY DEFINER function that exists so that
 * table's owner-only policy does not have to be widened; pulling it for a
 * whole list would mean reading fifty families' phone numbers to look at one.
 *
 * None of these signals is a verdict. A missing file number is the common
 * case, not a mark against a family — most people do not have it to hand at
 * 3am — so the absent states are worded as facts, never as warnings.
 */
export function PlausibilityPanel({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<RequestPlausibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRequestPlausibility(requestId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t.genericError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, t.genericError]);

  const row = (icon: React.ReactNode, text: string, tone = "#5A6B75") => (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span className="text-[12.5px] leading-relaxed" style={{ color: tone, textAlign: "start" }}>{text}</span>
    </div>
  );

  return (
    <div
      className="mt-3 rounded-2xl px-3.5 py-3 flex flex-col gap-2.5"
      style={{ background: "#F7FAFB", border: "1px solid rgba(11,36,50,0.06)" }}
      data-testid="plausibility-panel"
    >
      {loading && <div className="text-[12.5px]" style={{ color: "#8496A0" }}>…</div>}
      {error && <div className="text-[12.5px]" style={{ color: "#8A3438" }}>{error}</div>}

      {!loading && !error && data && (
        <>
          {data.postedByName &&
            row(<User className="w-4 h-4" style={{ color: "#5A6B75" }} />, t.postedByName.replace("{name}", data.postedByName), "#0B2432")}

          {/* Verified or not, stated either way. "Phone not verified" is a
              fact a committee should weigh, not a reason to refuse — RLS
              already prevents an unverified account from posting at all, so
              this can only be an account verified after the fact. */}
          {data.postedByPhoneVerified
            ? row(<CheckCircle2 className="w-4 h-4" style={{ color: "#12B76A" }} />, t.phoneVerifiedLabel, "#0E7A4B")
            : row(<ShieldAlert className="w-4 h-4" style={{ color: "#F5871F" }} />, t.phoneUnverifiedLabel, "#7A4A10")}

          {data.contactPhone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#0E8BA8" }} />
              <div style={{ textAlign: "start" }}>
                <a
                  href={`tel:${data.contactPhone}`}
                  className="text-[13px] font-bold no-underline"
                  style={{ color: "#0E8BA8", direction: "ltr", display: "inline-block" }}
                >
                  {data.contactPhone}
                </a>
                {/* Named as the family's, and named as regulated. A number on
                    a screen invites a call; this says whose it is. */}
                <div className="text-[11.5px] mt-0.5" style={{ color: "#8496A0" }}>{t.familyContactNote}</div>
              </div>
            </div>
          )}

          {row(
            <FileText className="w-4 h-4" style={{ color: data.fileRef ? "#5A6B75" : "#8496A0" }} />,
            data.fileRef ? t.fileRefLabel.replace("{ref}", data.fileRef) : t.noFileRef,
            data.fileRef ? "#5A6B75" : "#8496A0"
          )}

          {row(
            <MapPin className="w-4 h-4" style={{ color: data.inDirectory ? "#0E8BA8" : "#8496A0" }} />,
            data.inDirectory ? t.inDirectoryLabel : t.notInDirectory,
            data.inDirectory ? "#5A6B75" : "#8496A0"
          )}
        </>
      )}
    </div>
  );
}
