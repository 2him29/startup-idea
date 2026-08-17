import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileEdit, Trash2 } from "lucide-react";
import { submitDataSubjectRequest, fetchMyDataSubjectRequests, type DsrKind, type DataSubjectRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";

interface DataRightsScreenProps {
  onBack: () => void;
}

/**
 * Data-subject rights: access, correction, erasure.
 *
 * Deliberately a request queue worked by a human rather than a self-service
 * button. Automated erasure needs a retention policy decided first — which
 * records must outlive a deletion request (consent evidence, fulfilled
 * donation history) and for how long — and shipping an instant "delete
 * everything" before that answer exists would either destroy records we are
 * obliged to keep or quietly not delete what the user thinks it deleted.
 */
export function DataRightsScreen({ onBack }: DataRightsScreenProps) {
  const { t, dir } = useI18n();
  const toast = useToast();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const [existing, setExisting] = useState<DataSubjectRequest[]>([]);
  const [openKind, setOpenKind] = useState<DsrKind | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyDataSubjectRequests()
      .then((rows) => {
        if (!cancelled) setExisting(rows);
      })
      .catch((err) => console.error("Failed to load data-subject requests", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const options: { kind: DsrKind; label: string; icon: typeof Download; bg: string; fg: string }[] = [
    { kind: "export", label: t.dsrExport, icon: Download, bg: "#E4F6FB", fg: "#0E8BA8" },
    { kind: "correction", label: t.dsrCorrection, icon: FileEdit, bg: "#FFF3E0", fg: "#F5871F" },
    { kind: "deletion", label: t.dsrDeletion, icon: Trash2, bg: "#FFECEC", fg: "#E5484D" },
  ];

  const submit = async (kind: DsrKind) => {
    setBusy(true);
    try {
      await submitDataSubjectRequest(kind, details);
      setExisting(await fetchMyDataSubjectRequests());
      setOpenKind(null);
      setDetails("");
      toast("success", t.dsrSubmittedToast);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
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
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.dataRightsTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.dataRightsSub}</div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        {options.map((option, i) => {
          const Icon = option.icon;
          const isOpen = openKind === option.kind;
          return (
            <div key={option.kind} style={i < options.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}>
              <button
                onClick={() => {
                  setOpenKind(isOpen ? null : option.kind);
                  setDetails("");
                }}
                className="cursor-pointer w-full border-none bg-transparent py-[15px] px-[15px] flex items-center gap-3"
                style={{ textAlign: "start" }}
              >
                <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: option.bg }}>
                  <Icon className="w-[17px] h-[17px]" style={{ color: option.fg }} />
                </span>
                <span className="flex-1 text-[14.5px] font-semibold" style={{ color: "#0B2432" }}>{option.label}</span>
              </button>

              {isOpen && (
                <div className="px-[15px] pb-[15px]">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t.dsrDetailsPh}
                    rows={3}
                    className="w-full rounded-[13px] border-[1.5px] px-3.5 py-3 text-[14px] outline-none resize-none"
                    style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432", textAlign: "start" }}
                  />
                  <button
                    onClick={() => submit(option.kind)}
                    disabled={busy}
                    className="cursor-pointer disabled:opacity-60 mt-2.5 w-full h-11 rounded-2xl text-white text-[14px] font-extrabold border-none"
                    style={{ background: "linear-gradient(135deg,#0B2432,#1D3A4A)" }}
                  >
                    {option.label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {existing.length > 0 && (
        <div className="mt-5 bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {existing.map((row, i) => (
            <div
              key={row.id}
              className="px-[15px] py-[13px] flex items-center justify-between gap-3"
              style={i < existing.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
            >
              <span className="text-[13.5px] font-semibold" style={{ color: "#0B2432", textAlign: "start" }}>
                {options.find((o) => o.kind === row.kind)?.label ?? row.kind}
              </span>
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
                style={
                  row.status === "resolved"
                    ? { background: "#EAF6EF", color: "#0E7A4B" }
                    : { background: "#F1F5F6", color: "#5A6B75" }
                }
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
