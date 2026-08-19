/**
 * A blood group, rendered so it survives Arabic.
 *
 * "A+" and "O−" are Latin letters followed by a sign, and inside right-to-left
 * text the Unicode bidi algorithm treats that trailing sign as neutral — so it
 * gets reordered to the left and "O+" renders as "+O". Every screen in this app
 * shows a blood group next to Arabic copy, which made it the most-broken token
 * in the product for the language most users will pick.
 *
 * `direction: ltr` alone is not enough; the run has to be isolated from the
 * surrounding paragraph, which is what `unicodeBidi: isolate` does. The element
 * is inline-block so it participates in layout exactly as the text it replaces.
 */
export function BloodType({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      dir="ltr"
      className={className}
      style={{ direction: "ltr", unicodeBidi: "isolate", display: "inline-block", ...style }}
    >
      {value}
    </span>
  );
}
