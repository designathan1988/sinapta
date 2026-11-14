// Draws what the hand did over a photo, in a blank page of its own so
// the page under test is never touched: the trail of the step (each
// mouse report a dot, the line coloured by speed from blue, slow, to red,
// fast, thicker while the button is held), the presses and releases, the
// cursor in the shape the browser shows with a halo while held, and the
// keys pressed, as keycaps. The photo itself stays pixel for pixel.
import type { Page } from "playwright-core";
import { cursorDrawing } from "./capture-cursors.ts";
import {
  TYPED_MARK,
  type Mark,
  type Trace,
  type TracePoint,
} from "./capture-trace.ts";

export interface Layers {
  readonly cursor: boolean;
  readonly trail: boolean;
  readonly keys: boolean;
}

export interface Scene {
  readonly layers: Layers;
  readonly trace: Trace;
  readonly at: { x: number; y: number };
  readonly cursor: string;
  readonly pressed: boolean;
  // Where the photo's top left is on the page (a clipped photo).
  readonly origin: { x: number; y: number };
}

const escape = (text: string): string =>
  text.replace(/[&<>"]/g, (c) => `&#${String(c.charCodeAt(0))};`);

const speedColour = (a: TracePoint, b: TracePoint): string => {
  const speed = Math.hypot(b.x - a.x, b.y - a.y) / Math.max(b.t - a.t, 1);
  return `hsl(${String(Math.round(220 - Math.min(speed / 3, 1) * 220))} 90% 50%)`;
};

function trailDrawing(moves: readonly TracePoint[]): string {
  const parts: string[] = [];
  moves.forEach((b, index) => {
    const a = moves[index - 1];
    if (a === undefined) return;
    const colour = speedColour(a, b);
    const width = b.pressed ? 2.6 : 1.5;
    parts.push(
      `<line x1="${String(a.x)}" y1="${String(a.y)}" x2="${String(b.x)}" y2="${String(b.y)}" stroke="${colour}" stroke-width="${String(width)}" stroke-linecap="round" opacity="0.9"/>`,
      `<circle cx="${String(b.x)}" cy="${String(b.y)}" r="1.1" fill="${colour}"/>`,
    );
  });
  const start = moves[0];
  if (start !== undefined) {
    parts.unshift(
      `<rect x="${String(start.x - 3)}" y="${String(start.y - 3)}" width="6" height="6" fill="none" stroke="#2b6cff" stroke-width="1.4"/>`,
    );
  }
  return parts.join("");
}

function markDrawing(mark: Mark): string {
  const colour = mark.button === "right" ? "#a855f7" : "#ff8a00";
  const at = `cx="${String(mark.x)}" cy="${String(mark.y)}"`;
  if (mark.kind === "up") {
    return `<circle ${at} r="7" fill="none" stroke="${colour}" stroke-width="1.6"/>`;
  }
  const again =
    mark.clicks > 1
      ? `<circle ${at} r="11" fill="none" stroke="${colour}" stroke-width="1.2"/>`
      : "";
  return `${again}<circle ${at} r="4" fill="${colour}" stroke="#fff" stroke-width="1"/>`;
}

function cursorLayer(scene: Scene): string {
  const { x, y } = scene.at;
  const halo = scene.pressed
    ? `<circle cx="${String(x)}" cy="${String(y)}" r="12" fill="rgb(255 138 0 / 0.28)" stroke="#ff8a00" stroke-width="1.2"/>`
    : "";
  const marks = scene.trace.marks.map(markDrawing).join("");
  const shape = `<g transform="translate(${String(x)} ${String(y)})">${cursorDrawing(scene.cursor)}</g>`;
  return `${marks}${halo}${shape}`;
}

function legend(moves: readonly TracePoint[]): string {
  let length = 0;
  let peak = 0;
  moves.forEach((b, index) => {
    const a = moves[index - 1];
    if (a === undefined) return;
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    length += step;
    peak = Math.max(peak, step / Math.max(b.t - a.t, 1));
  });
  const first = moves[0]?.t ?? 0;
  const seconds = ((moves[moves.length - 1]?.t ?? first) - first) / 1000;
  const facts = `${String(moves.length - 1)} reports · ${String(Math.round(length))} px · ${seconds.toFixed(2)} s · peak ${peak.toFixed(1)} px/ms`;
  return `<div class="legend">Trail · ${facts}<span class="scale"></span><small>slow → fast · thick = button held</small></div>`;
}

function keysStrip(keys: readonly string[]): string {
  const pills = keys.slice(-6).map((label) => {
    const caps = label.split(" + ").map((key) => `<kbd>${escape(key)}</kbd>`);
    return label.startsWith(TYPED_MARK)
      ? `<div class="pill typed">${escape(label.slice(TYPED_MARK.length).slice(-70))}</div>`
      : `<div class="pill">${caps.join("<b>+</b>")}</div>`;
  });
  return `<div class="keys">${pills.join("")}</div>`;
}

const STYLE = `
body { margin: 0; font: 13px "Segoe UI", sans-serif; }
img, svg { position: fixed; left: 0; top: 0; display: block; }
.legend, .pill { background: rgb(20 20 20 / 0.86); color: #fff; border-radius: 8px; }
.legend { position: fixed; left: 12px; bottom: 12px; padding: 8px 12px; display: grid; gap: 4px; }
.legend small { opacity: 0.75; }
.scale { height: 6px; border-radius: 3px; background: linear-gradient(90deg, hsl(220 90% 50%), hsl(110 90% 50%), hsl(0 90% 50%)); }
.keys { position: fixed; left: 0; right: 0; bottom: 14px; display: grid; justify-items: center; gap: 6px; }
.pill { padding: 6px 10px; display: flex; gap: 6px; align-items: center; }
.typed { font: 15px Consolas, monospace; white-space: pre; }
kbd { font: 600 14px "Segoe UI", sans-serif; padding: 3px 8px; border-radius: 5px; background: #fafafa; color: #111; box-shadow: inset 0 -2px 0 #bbb; }
b { font-weight: 400; opacity: 0.7; }`;

function sceneHtml(
  photo: string,
  size: { width: number; height: number },
  scene: Scene,
): string {
  const { layers, trace, origin } = scene;
  const box = `${String(origin.x)} ${String(origin.y)} ${String(size.width)} ${String(size.height)}`;
  const trail = layers.trail ? trailDrawing(trace.moves) : "";
  const cursor = layers.cursor ? cursorLayer(scene) : "";
  // A clipped photo is a detail: panels would cover what it shows.
  const panels = size.width >= 1000 && size.height >= 600;
  return [
    `<!doctype html><style>${STYLE}</style>`,
    `<img src="data:image/png;base64,${photo}" width="${String(size.width)}" height="${String(size.height)}">`,
    `<svg width="${String(size.width)}" height="${String(size.height)}" viewBox="${box}">${trail}${cursor}</svg>`,
    panels && layers.trail && trace.moves.length > 3 ? legend(trace.moves) : "",
    panels && layers.keys && trace.keys.length > 0 ? keysStrip(trace.keys) : "",
  ].join("");
}

// The photo with the scene drawn on it, at the photo's own pixels.
export async function compose(
  composer: Page,
  shot: Buffer,
  scene: Scene,
): Promise<Buffer> {
  // A PNG's width and height sit at bytes 16 and 20; the photo is at 2x.
  const size = {
    width: shot.readUInt32BE(16) / 2,
    height: shot.readUInt32BE(20) / 2,
  };
  await composer.setViewportSize({
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
  });
  await composer.setContent(sceneHtml(shot.toString("base64"), size, scene));
  return composer.screenshot({ clip: { x: 0, y: 0, ...size } });
}
