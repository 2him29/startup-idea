/**
 * The screen background: a zellige lattice over the existing gradient.
 *
 * Twenty-two screens carried the same gradient string inline, which is fine
 * until you want to change it in one place. They share this constant now.
 *
 * The pattern is the eight-pointed star of Maghrebi zellige — a square and the
 * same square turned forty-five degrees — drawn as an SVG tile rather than
 * loaded as an image. That matters for more than weight. Photographic
 * backgrounds were the alternative and the three in the repository could not be
 * used: one is a watermarked stock comp, and two are photographs of Australian
 * Red Cross bags carrying another organisation's mark, real barcodes and real
 * donation numbers. There is also a reason not to want them. Donor-recruitment
 * work consistently finds that blood and needle imagery raises anxiety, and
 * this application exists to make people say yes.
 *
 * Generated instead: no licence, no watermark, no attribution, sharp at any
 * density, and about four hundred bytes.
 *
 * Kept faint on purpose. It should register as texture when someone looks for
 * it and disappear while they are reading — every screen puts opaque cards on
 * top of it, and the pattern must never compete with a blood type.
 */

/*
 * Single quotes throughout so the markup survives a template literal, and the
 * whole thing is URI-encoded because a data URI containing a raw `#` — which
 * every colour here has — terminates at the first one and yields a background
 * that silently does not load.
 *
 * The tile is seamless: the star sits at the centre, and a quarter-diamond at
 * each corner meets its three neighbours to complete a whole one.
 *
 * Strength is a parameter because the two surfaces need different answers.
 * Content screens cover most of the lattice with opaque cards, so it can hold
 * its own there; the splash puts a paragraph directly on top of it, and at the
 * same strength the stars read through the one sentence that has to land.
 */
function zellige(strokeOpacity: number): string {
  const tile = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>",
    `<g fill='none' stroke='#E5484D' stroke-opacity='${strokeOpacity}' stroke-width='1'>`,
    "<rect x='18' y='18' width='28' height='28'/>",
    "<rect x='18' y='18' width='28' height='28' transform='rotate(45 32 32)'/>",
    "<rect x='-7' y='-7' width='14' height='14' transform='rotate(45 0 0)'/>",
    "<rect x='57' y='-7' width='14' height='14' transform='rotate(45 64 0)'/>",
    "<rect x='-7' y='57' width='14' height='14' transform='rotate(45 0 64)'/>",
    "<rect x='57' y='57' width='14' height='14' transform='rotate(45 64 64)'/>",
    "</g></svg>",
  ].join("");
  return `url("data:image/svg+xml,${encodeURIComponent(tile)}")`;
}

/** The lattice at content strength, for surfaces that supply their own colour. */
export const ZELLIGE = zellige(0.13);

/**
 * The standard screen background.
 *
 * Layer order is deliberate: the lattice is listed first because CSS paints
 * the first background layer on top, so the pattern sits over the gradient
 * rather than under it.
 */
export const SCREEN_BG =
  `${ZELLIGE} repeat, linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)`;

/**
 * The splash, which keeps its own warmer radial wash.
 *
 * It is the first thing anyone sees and the one screen with no cards over it,
 * so the lattice is the whole texture rather than a hint behind something else
 * — and also the one screen where body text sits straight on it. Softer for
 * that reason: at content strength the stars read through the sentence.
 */
export const SPLASH_BG =
  `${zellige(0.09)} repeat, radial-gradient(130% 90% at 50% -10%, #FFE1E0 0%, #FFF3F2 40%, #F4FBFC 100%)`;
