import { Home, Search, User, LayoutList, HeartHandshake, BadgeCheck, Droplet } from "lucide-react";
import { isPatientModelEnabled, useCommitteeInbox } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
}

/**
 * Screens that deliberately have no bottom bar, rather than a list of the ones
 * that do.
 *
 * It was an allowlist, and that shape produced the same bug three times: a new
 * screen was added, nobody thought to register it, and the navigation silently
 * vanished there — found each time by a test failing for an unrelated-looking
 * reason. Defaulting to "show the bar" means forgetting costs nothing, and the
 * exceptions below are few and deliberate.
 *
 * These four are all mid-journey interruptions: the user is being asked for
 * one specific thing, and offering five ways to leave invites abandoning it.
 * (Signed-out screens need no entry at all — the early return covers them.)
 */
const hideNavOn = ["auth", "donor-registration", "verify-phone", "consent"];

export function BottomNavigation({ activeScreen, onNavigate, userType }: BottomNavigationProps) {
  // Every hook runs before the early return below: React requires the same
  // hooks in the same order on every render, and this component returns null
  // on most screens.
  const { t } = useI18n();
  const patientModel = isPatientModelEnabled();
  const { isMember, waiting } = useCommitteeInbox();

  if (!userType || hideNavOn.includes(activeScreen)) return null;
  // Under the patient model the hospital account type no longer has a nav of
  // its own — hospitals are a text field on a request, not a role — so every
  // signed-in user gets the donor-side navigation.
  const isHospital = userType === "hospital" && !patientModel;
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const accentSoft = isHospital ? "#E4F6FB" : "#FFECEC";

  /**
   * Nav B: five slots, and the fourth is the one that changes.
   *
   * A donor sees Give. A member of an approved committee sees Committee, which
   * opens a hub covering both verifying and donor search — one job with two
   * tools, so one tab. Give stays reachable from the Home quick actions, which
   * matters during Ramadan when compensation is the busiest flow in the app.
   *
   * Verify and Donors were separate tabs before this, which made six — two too
   * many for a phone, and both irrelevant to the overwhelming majority of users
   * who are only ever donors.
   */
  const navItems = patientModel
    ? [
        { id: "home", icon: Home, label: t.navHome },
        { id: "matching", icon: Search, label: t.navFind },
        { id: "post-request", icon: Droplet, label: t.navRequestLabel },
        isMember
          ? { id: "committee", icon: BadgeCheck, label: t.navCommittee, badge: waiting }
          : { id: "compensate", icon: HeartHandshake, label: t.navGive },
        { id: "profile", icon: User, label: t.navProfile },
      ]
    : [
        { id: "home", icon: Home, label: t.navHome },
        ...(isHospital ? [{ id: "hospital", icon: LayoutList, label: t.requestsNav }] : []),
        { id: "matching", icon: Search, label: isHospital ? t.donorsNav : t.navFind },
        ...(isHospital ? [] : [{ id: "compensate", icon: HeartHandshake, label: t.navGive }]),
        { id: "profile", icon: User, label: t.navProfile },
      ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[15] px-4 pt-[9px] md:hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(11,36,50,0.07)",
        paddingBottom: "calc(9px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-testid={`nav-${item.id}`}
              /*
               * The badge digit sits inside the button, so without an explicit
               * label the accessible name comes out as "Committee8" — which a
               * screen reader reads as one word and which no name-based query
               * can match. Spell the count out instead, and hide the visual
               * badge from the accessibility tree as the duplicate it is.
               */
              aria-label={
                "badge" in item && typeof item.badge === "number" && item.badge > 0
                  ? t.navCommitteeWaiting.replace("{count}", String(item.badge))
                  : item.label
              }
              className="cursor-pointer border-none flex flex-col items-center gap-[3px] px-4 py-2 rounded-[14px]"
              style={{
                background: isActive ? accentSoft : "transparent",
                color: isActive ? accent : "#9AA9B2",
              }}
            >
              <span className="relative">
                <Icon className="w-[23px] h-[23px]" strokeWidth={2} />
                {/* Count on the tab, so a volunteer knows there is something
                    to do without opening the hub first. */}
                {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute text-[10px] font-extrabold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center"
                    style={{ background: "#E5484D", color: "#fff", top: "-4px", insetInlineEnd: "-8px" }}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
