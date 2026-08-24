/**
 * How far along a request is, measured against what it actually asked for.
 *
 * The screens used to show a bare count — "2 coming so far." A donor reading
 * that cannot answer the only question they are asking, which is whether they
 * are still needed. Two donors is plenty for a request wanting one unit and
 * barely a start on one wanting six, and the count reads identically in both
 * cases. Measuring against `units` turns the same number into an answer.
 *
 * One confirmed donor is counted as one unit. A standard whole-blood donation
 * is a single unit, so the two are the same quantity for the requests this app
 * carries; apheresis, which can yield more, is not something a donor arranges
 * through here. If that ever changes this is the function to change, and the
 * callers keep working.
 *
 * Nothing here says a unit has been *collected*. A confirmed response is a
 * person saying they will come, which is a promise and not a bag in a fridge —
 * hence "pledged" everywhere in the copy. Blurring those two would put back
 * exactly the kind of claim the app has been removing.
 */
export interface PledgeProgress {
  /** Confirmed donors, clamped to zero. */
  pledged: number;
  /** Units the request asked for; at least one. */
  needed: number;
  /** 0–100, clamped. Never exceeds 100 even when more donors answer than asked. */
  percent: number;
  /** True once as many donors have answered as there are units needed. */
  enough: boolean;
}

export function pledgeProgress(pledged: number, unitsNeeded: number): PledgeProgress {
  // `units` is `not null default 1` in the schema, but a legacy row or a bad
  // payload reaching zero would divide by it. One is the smallest honest need.
  const needed = Number.isFinite(unitsNeeded) && unitsNeeded > 0 ? Math.floor(unitsNeeded) : 1;
  const safe = Number.isFinite(pledged) && pledged > 0 ? Math.floor(pledged) : 0;

  return {
    pledged: safe,
    needed,
    // Capped: a request for one unit that four donors answered is at 100%, not
    // 400%. The overflow is real and worth knowing, but it belongs in `enough`
    // — a bar past its own end reads as a rendering fault.
    percent: Math.min(100, Math.round((safe / needed) * 100)),
    enough: safe >= needed,
  };
}
