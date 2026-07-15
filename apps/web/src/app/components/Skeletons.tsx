/** Shimmer placeholders shown while live request data loads. */

export function RequestCardSkeleton() {
  return (
    <div
      className="w-full border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
      style={{ borderColor: "rgba(11,36,50,0.06)" }}
    >
      <div className="flex items-start gap-[13px]">
        <span className="wa-skeleton w-12 h-12 rounded-[15px] shrink-0" />
        <div className="flex-1 pt-1">
          <div className="wa-skeleton h-4 w-2/3" />
          <div className="wa-skeleton h-3 w-1/2 mt-2" />
        </div>
        <span className="wa-skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3.5 flex items-center gap-2.5">
        <span className="wa-skeleton h-8 w-12 rounded-xl" />
        <span className="wa-skeleton h-4 w-16" />
      </div>
    </div>
  );
}

export function RequestRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid rgba(11,36,50,0.05)" }}>
      <span className="wa-skeleton w-10 h-10 rounded-[11px] shrink-0" />
      <div className="flex-1">
        <div className="wa-skeleton h-3.5 w-1/3" />
        <div className="wa-skeleton h-3 w-1/2 mt-1.5" />
      </div>
      <span className="wa-skeleton h-7 w-12 rounded-[9px]" />
      <span className="wa-skeleton h-5 w-14 rounded-full" />
    </div>
  );
}
