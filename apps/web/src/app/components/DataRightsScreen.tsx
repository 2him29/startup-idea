import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileEdit, Trash2 } from "lucide-react";
import { submitDataSubjectRequest, fetchMyDataSubjectRequests, formatRelativeTime, type DsrKind, type DataSubjectRequest, errorMessage} from "@weare/core";
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
  const { t, lang, dir } = useI18n();
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

  /**
   * Each right says what it produces and roughly how long it takes. "Request a
   * copy" with no timescale invites people to ask again on day two, and a
   * deletion request with no note about what survives invites the complaint
   * that we kept something.
   */
  const options: { kind: DsrKind; label: string; detail: string; note?: string; icon: typeof Download; bg: string; fg: string }[] = [
    { kind: "export", label: t.dsrExport, detail: t.dsrExportDetail, icon: Download, bg: "#E4F6FB", fg: "#0E8BA8" },
    { kind: "correction", label: t.dsrCorrection, detail: t.dsrCorrectionDetail, icon: FileEdit, bg: "#FFF3E0", fg: "#F5871F" },
    { kind: "deletion", label: t.dsrDeletion, detail: t.dsrDeletionDetail, note: t.dsrDeletionLegal, icon: Trash2, bg: "#FFECEC", fg: "#E5484D" },
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
      toast("error", errorMessage(err, t.genericError));
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
                <span className="flex-1" style={{ textAlign: "start" }}>
                  <span className="block text-[14.5px] font-semibold" style={{ color: "#0B2432" }}>{option.label}</span>
                  <span className="block text-[11.5px] mt-0.5" style={{ color: "#8496A0" }}>{option.detail}</span>
                </span>
              </button>

              {isOpen && (
                <div className="px-[15px] pb-[15px]">
                  {option.note && (
                    <div
                      className="mb-2.5 rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed"
                      style={{ background: "#F7FAFB", color: "#5A6B75", textAlign: "start" }}
                    >
                      {option.note}
                    </div>
                  )}
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
        <>
        <div className="mt-5 mb-[11px] text-[15px] font-extrabold" style={{ color: "#0B2432", textAlign: "start" }}>
          {t.dsrQueueTitle}
        </div>
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {existing.map((row, i) => (
            <div
              key={row.id}
              className="px-[15px] py-[13px] flex items-center justify-between gap-3"
              style={i < existing.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
            >
              <span style={{ textAlign: "start" }}>
                <span className="block text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>
                  {options.find((o) => o.kind === row.kind)?.label ?? row.kind}
                </span>
                <span className="block text-[11.5px] mt-0.5" style={{ color: "#8496A0" }}>
                  {formatRelativeTime(row.createdAt, lang)}
                </span>
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
        </>
      )}
    </div>
  );
}
