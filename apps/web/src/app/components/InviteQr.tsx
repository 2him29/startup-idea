import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import QRCode from "qrcode";
import { inviteUrl } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface InviteQrProps {
  code: string;
  associationName: string;
  onClose: () => void;
}

/**
 * One invite, big enough to hold up or print.
 *
 * Copying a link and sharing it to WhatsApp is how a committee reaches the
 * donors it already has. This is for the ones it does not: a blood drive, where
 * everyone in the room has already said yes and is standing in front of you.
 * Neither a clipboard nor a share sheet works across a folding table.
 *
 * The code is printed underneath the pattern rather than hidden inside it,
 * because a phone that will not scan is common and reading ten characters aloud
 * is not. That is also why the alphabet has no O, 0, I or 1 — the decision was
 * made in 20260824120000 for exactly this moment.
 *
 * Error correction is level H, the same as the deployment's own code: it
 * survives a bad print, a crease, a screen photographed at an angle, and a
 * thumb over one corner.
 */
export function InviteQr({ code, associationName, onClose }: InviteQrProps) {
  const { t } = useI18n();
  const [png, setPng] = useState<string | null>(null);
  const url = inviteUrl(code);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 2, width: 900 })
      .then((d) => {
        if (!cancelled) setPng(d);
      })
      .catch((err) => console.error("Could not render the invite QR", err));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 invite-qr-sheet"
      style={{ background: "#FFFFFF" }}
      data-testid="invite-qr"
    >
      {/* Hidden when printing: paper needs the code, not the chrome. */}
      <button
        onClick={onClose}
        aria-label={t.dismiss}
        data-testid="close-invite-qr"
        className="no-print cursor-pointer absolute top-4 w-10 h-10 rounded-xl border bg-white flex items-center justify-center"
        style={{ borderColor: "rgba(11,36,50,0.12)", insetInlineEnd: "1rem" }}
      >
        <X className="w-5 h-5" style={{ color: "#0B2432" }} />
      </button>

      <div className="text-center max-w-[440px] w-full">
        <div className="text-[15px] font-extrabold" style={{ color: "#0B2432" }}>{associationName}</div>
        <div className="text-[12.5px] mt-1" style={{ color: "#6B7C88" }}>{t.invitesQrLead}</div>

        {png ? (
          <img
            src={png}
            alt=""
            className="w-full max-w-[340px] mx-auto mt-4"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="w-full max-w-[340px] mx-auto mt-4 aspect-square rounded-2xl" style={{ background: "#F2F5F6" }} />
        )}

        {/* Read aloud when a camera will not cooperate. */}
        <div
          className="text-[26px] font-extrabold tracking-[4px] mt-2"
          style={{ color: "#0B2432", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        >
          {code}
        </div>
        <div className="text-[12px] mt-2 break-all" style={{ color: "#8496A0" }}>{url}</div>

        <button
          onClick={() => window.print()}
          data-testid="print-invite-qr"
          className="no-print cursor-pointer mt-6 w-full h-[50px] rounded-2xl text-white text-[15px] font-extrabold border-none flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6B4FC0,#8A6BD6)" }}
        >
          <Printer className="w-[18px] h-[18px]" />
          {t.invitesQrPrint}
        </button>
      </div>
    </div>
  );
}
