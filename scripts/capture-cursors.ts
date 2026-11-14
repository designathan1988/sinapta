// The mouse cursor as Windows draws it at 200 % (a CSS pixel is two
// device pixels), one SVG drawing per CSS cursor keyword, with the hot
// spot at 0,0: white shapes with a black edge, line cursors as a black
// line inside a white one. Each shape is drawn twice, first black and
// widened by the edge, then white on top, so overlapping parts read as
// one outline.
type Draw = string;

const solid = (shape: Draw): Draw =>
  `<g fill="#000" stroke="#000" stroke-width="2" stroke-linejoin="round">${shape}</g>` +
  `<g fill="#fff">${shape}</g>`;

const lines = (path: string): Draw =>
  `<path d="${path}" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>` +
  `<path d="${path}" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"/>`;

const ARROW = solid(
  '<path d="M0 0 L0 16.5 L4 12.8 L6.9 19 L9.4 17.9 L6.6 11.8 L11.8 11.8 Z"/>',
);

// The pointing hand, the index fingertip on the hot spot.
const HAND = solid(
  '<rect x="-2" y="0" width="4" height="12" rx="2"/>' +
    '<rect x="1.6" y="5.2" width="3.8" height="8" rx="1.9"/>' +
    '<rect x="5.2" y="6.2" width="3.6" height="8" rx="1.8"/>' +
    '<rect x="8.6" y="7.6" width="3.4" height="7" rx="1.7"/>' +
    '<path d="M-2 10 L-6.6 7.6 Q-8.6 7.4 -7.8 9.6 L-3.4 17.4 Q-1.2 21 3 21 L7 21 Q12 21 12 15.6 L12 12 Z"/>',
);

// The open and the closed hand Chrome shows for grab and grabbing.
const GRAB = solid(
  '<rect x="-6.4" y="-6" width="3.2" height="10" rx="1.6"/>' +
    '<rect x="-2.8" y="-8.6" width="3.2" height="12" rx="1.6"/>' +
    '<rect x="0.8" y="-8" width="3.2" height="11.5" rx="1.6"/>' +
    '<rect x="4.4" y="-6.2" width="3" height="10" rx="1.5"/>' +
    '<path d="M-6.4 0 L-9.6 -1.4 Q-11.2 -1 -10.4 1 L-6.6 8 Q-4.6 11 -0.6 11 L2.6 11 Q7.4 11 7.4 6 L7.4 0 Z"/>',
);
const GRABBING = solid(
  '<rect x="-6.2" y="-3" width="3.2" height="6" rx="1.6"/>' +
    '<rect x="-2.8" y="-4" width="3.2" height="7" rx="1.6"/>' +
    '<rect x="0.8" y="-3.8" width="3.2" height="7" rx="1.6"/>' +
    '<rect x="4.2" y="-3" width="3" height="6" rx="1.5"/>' +
    '<path d="M-6.2 0 L-8.4 1 Q-9.4 2 -8.2 3.6 L-5.6 8 Q-3.8 10.6 -0.4 10.6 L2.6 10.6 Q7.2 10.6 7.2 5.6 L7.2 0 Z"/>',
);

const IBEAM = lines(
  "M-3 -8.5 Q0 -8.5 0 -6.5 Q0 -8.5 3 -8.5 M0 -6.5 L0 6.5 M-3 8.5 Q0 8.5 0 6.5 Q0 8.5 3 8.5",
);

// A double-headed arrow along the x axis, turned for the other axes.
const DOUBLE = solid(
  '<path d="M-10 0 L-5.5 -4.5 L-5.5 -1.6 L5.5 -1.6 L5.5 -4.5 L10 0 L5.5 4.5 L5.5 1.6 L-5.5 1.6 L-5.5 4.5 Z"/>',
);
const turned = (draw: Draw, degrees: number): Draw =>
  `<g transform="rotate(${String(degrees)})">${draw}</g>`;

const MOVE = solid(
  '<path d="M0 -10 L4 -6 L1.5 -6 L1.5 -1.5 L6 -1.5 L6 -4 L10 0 L6 4 L6 1.5 L1.5 1.5 L1.5 6 L4 6 L0 10 L-4 6 L-1.5 6 L-1.5 1.5 L-6 1.5 L-6 4 L-10 0 L-6 -4 L-6 -1.5 L-1.5 -1.5 L-1.5 -6 L-4 -6 Z"/>',
);
const SPLIT = solid(
  '<rect x="-2.6" y="-9" width="1.8" height="18"/><rect x="0.8" y="-9" width="1.8" height="18"/>' +
    '<path d="M-11 0 L-6.6 -4 L-6.6 -1.2 L-2.6 -1.2 L-2.6 1.2 L-6.6 1.2 L-6.6 4 Z"/>' +
    '<path d="M11 0 L6.6 -4 L6.6 -1.2 L2.6 -1.2 L2.6 1.2 L6.6 1.2 L6.6 4 Z"/>',
);

const NOT_ALLOWED =
  '<circle r="8" fill="none" stroke="#fff" stroke-width="4.4"/>' +
  '<circle r="8" fill="none" stroke="#000" stroke-width="2.2"/>' +
  lines("M-5.6 5.6 L5.6 -5.6");

// Windows 11's busy ring, blue, a gap in it.
const RING = (r: number): Draw =>
  `<circle r="${String(r)}" fill="none" stroke="#fff" stroke-width="4"/>` +
  `<circle r="${String(r)}" fill="none" stroke="#1683d8" stroke-width="2.4" stroke-dasharray="${String(r * 4.6)} ${String(r * 1.6)}"/>`;

const CROSS = lines("M0 -10 L0 10 M-10 0 L10 0");
const CELL = solid(
  '<path d="M-2.2 -8 H2.2 V-2.2 H8 V2.2 H2.2 V8 H-2.2 V2.2 H-8 V-2.2 H-2.2 Z"/>',
);
const ZOOM = (plus: boolean): Draw =>
  '<circle r="6" fill="#fff" stroke="#000" stroke-width="1.6"/>' +
  lines(`M4.4 4.4 L9 9 M-3 0 L3 0${plus ? " M0 -3 L0 3" : ""}`);

// The arrow with a small sign beside it, as copy, alias, help do.
const withBadge = (badge: Draw): Draw =>
  `${ARROW}<g transform="translate(13 15)">${badge}</g>`;
const BOX =
  '<rect x="-4.5" y="-4.5" width="9" height="9" rx="1" fill="#fff" stroke="#000"/>';

const SHAPES: Record<string, Draw> = {
  default: ARROW,
  pointer: HAND,
  text: IBEAM,
  "vertical-text": turned(IBEAM, 90),
  grab: GRAB,
  grabbing: GRABBING,
  move: MOVE,
  "all-scroll": MOVE,
  "ew-resize": DOUBLE,
  "ns-resize": turned(DOUBLE, 90),
  "nwse-resize": turned(DOUBLE, 45),
  "nesw-resize": turned(DOUBLE, -45),
  "col-resize": SPLIT,
  "row-resize": turned(SPLIT, 90),
  "not-allowed": NOT_ALLOWED,
  wait: RING(8),
  progress: withBadge(RING(4.5)),
  crosshair: CROSS,
  cell: CELL,
  "zoom-in": ZOOM(true),
  "zoom-out": ZOOM(false),
  help: withBadge(
    `${BOX}<text y="3.2" text-anchor="middle" font-size="8" font-weight="700" font-family="Segoe UI, sans-serif">?</text>`,
  ),
  copy: withBadge(`${BOX}${lines("M-2.4 0 H2.4 M0 -2.4 V2.4")}`),
  alias: withBadge(`${BOX}${lines("M-2 2 L2 -2 M-0.4 -2 H2 V0.4")}`),
  "context-menu": withBadge(
    `${BOX}${lines("M-2.4 -1.6 H2.4 M-2.4 0.4 H2.4 M-2.4 2.4 H2.4")}`,
  ),
  "no-drop": withBadge(`<g transform="scale(0.55)">${NOT_ALLOWED}</g>`),
  none: "",
};

const ALIASES: Record<string, string> = {
  "e-resize": "ew-resize",
  "w-resize": "ew-resize",
  "n-resize": "ns-resize",
  "s-resize": "ns-resize",
  "nw-resize": "nwse-resize",
  "se-resize": "nwse-resize",
  "ne-resize": "nesw-resize",
  "sw-resize": "nesw-resize",
};

// The drawing for a cursor keyword; an unknown one is the arrow.
export function cursorDrawing(keyword: string): string {
  return SHAPES[ALIASES[keyword] ?? keyword] ?? ARROW;
}
