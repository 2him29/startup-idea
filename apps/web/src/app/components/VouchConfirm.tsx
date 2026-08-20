import { BadgeCheck, X } from "lucide-react";
import { unitsLabel, type BloodRequest } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";

interface VouchConfirmProps {
  request: BloodRequest;
  wilaya: string;
  /** The person vouching, named so they see whose signature this is. */
  memberName: string;
  associationName: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The step between deciding and publishing.
 *
 * Verifying is not an internal flag — it puts the committee's name on a
 * stranger's plea and donors use it to decide whether to drive across a
 * wilaya. That is too much to hang on one tap on a phone held in a hospital
 * corridor, and a mis-tap is not hypothetical: a stray click on the
 * neighbouring button removed a verification on the live project while this
 * screen was being tested.
 *
 * So it restates the three things worth checking — which patient, what is
 * being asked for, and in whose name it goes out — and makes the destructive
 * reading (Cancel) the easy one to reach.
 */
export function VouchConfirm({
  request,
  wilaya,
  memberName,
  associationName,
  busy,
  onConfirm,
  onCancel,
}: VouchConfirmProps) {
  const { t, lang } = useI18n();
  const who = request.patientName?.trim() || request.hospital;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(11,36,50,0.45)" }}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="vouch-confirm"
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-[420px] md:mb-8 rounded-t-[26px] md:rounded-[26px] bg-white p-[22px]"
        style={{ animation: "waRise .25s ease both" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-[17px] font-extrabold leading-snug" style={{ color: "#0B2432", textAlign: "start" }}>
            {t.confirmVouchTitle.replace("{patient}", who)}
          </div>
          <button
            onClick={onCancel}
            /* "Dismiss", not "Cancel": the sheet already has a Cancel button,
               and two controls sharing an accessible name is ambiguous to a
               screen reader before it is ambiguous to a test. */
            aria-label={t.dismiss}
            className="cursor-pointer w-8 h-8 rounded-full border-none shrink-0 flex items-center justify-center"
            style={{ background: "#F1F5F6" }}
          >
            <X className="w-4 h-4" style={{ color: "#5A6B75" }} />
          </button>
        </div>

        {/* What is actually being asked for, so the decision is made against
            the request rather than against a remembered card. */}
        <div className="mt-3.5 flex items-center gap-3 flex-wrap rounded-2xl px-3.5 py-3" style={{ background: "#F7FAFB" }}>
          <BloodType
            value={request.bloodType}
            className="font-extrabold text-sm px-3 py-1.5 rounded-xl"
            style={{ color: "#E5484D", background: "#FFECEC" }}
          />
          <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(request.units, t, lang)}</span>
          <span className="text-[12.5px] truncate" style={{ color: "#8496A0" }}>{request.hospital}</span>
        </div>

        <div className="mt-3.5 text-[13px] leading-relaxed" style={{ color: "#5A6B75", textAlign: "start" }}>
          {t.confirmVouchBody.replace("{wilaya}", wilaya)}
        </div>

        {memberName && (
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: "#EEE9FB", textAlign: "start" }}>
            <BadgeCheck className="w-[17px] h-[17px] shrink-0" style={{ color: "#6B4FC0" }} />
            <span className="text-[12.5px] font-semibold" style={{ color: "#3F2E77" }}>
              {t.vouchingAs.replace("{name}", `${memberName} · ${associationName}`)}
            </span>
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={busy}
          data-testid="vouch-confirm-yes"
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold border-none flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#12B76A,#0E9F5B)" }}
        >
          <BadgeCheck className="w-[18px] h-[18px]" />
          {t.confirmVouchYes}
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer mt-2.5 w-full h-[48px] rounded-2xl text-[14.5px] font-bold bg-transparent border-none"
          style={{ color: "#5A6B75" }}
        >
          {t.confirmVouchCancel}
        </button>
      </div>
    </div>
  );
}
