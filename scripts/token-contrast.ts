// The WCAG contrast ratio of two OKLCH colors from the token files, so that
// the colors text is drawn in are checked whenever a token changes. A
// translucent surface, such as a hover wash, is first laid over the
// surface it sits on, as the browser paints it.
import { isRecord } from "./token-tree.ts";

export type Oklch = readonly [number, number, number];

// A token's OKLCH components, or undefined for any other value.
export function oklchOf(value: unknown): Oklch | undefined {
  if (!isRecord(value) || value.colorSpace !== "oklch") return undefined;
  const { components } = value;
  if (!Array.isArray(components) || components.length !== 3) return undefined;
  const [l, c, h] = components.map(Number);
  if (l === undefined || c === undefined || h === undefined) return undefined;
  return [l, c, h];
}

// OKLCH to linear sRGB, clipped to the gamut, as the browser draws it.
function linearRgb([l, c, h]: Oklch): readonly number[] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((value) => value ** 3);
  const [x = 0, y = 0, z = 0] = lms;
  return [
    4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z,
    -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z,
    -0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z,
  ].map((value) => Math.min(1, Math.max(0, value)));
}

// A token's alpha: 1 unless it says otherwise.
export function alphaOf(value: unknown): number {
  if (!isRecord(value) || typeof value.alpha !== "number") return 1;
  return value.alpha;
}

// sRGB channels as the browser stores them, from 0 to 1.
export type Srgb = readonly [number, number, number];

function encode(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function decode(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function srgbOf(color: Oklch): Srgb {
  const [r = 0, g = 0, b = 0] = linearRgb(color).map(encode);
  return [r, g, b];
}

// A color laid with some alpha over another, blended as the browser
// composites: in sRGB.
export function over(top: Oklch, alpha: number, under: Srgb): Srgb {
  const paint = srgbOf(top);
  const [r = 0, g = 0, b = 0] = paint.map(
    (channel, index) => alpha * channel + (1 - alpha) * (under[index] ?? 0),
  );
  return [r, g, b];
}

function luminance(color: Srgb): number {
  const [r = 0, g = 0, b = 0] = color.map(decode);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Srgb, b: Srgb): number {
  const [lighter = 0, darker = 0] = [luminance(a), luminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
