// The widths a person drags, in rem: the sidebar's and the side peek's.

export const SIDEBAR_WIDTH = {
  min: 12,
  // Notion's sidebar, 270 pixels.
  initial: 16.875,
  max: 30,
  step: 1,
} as const;

export const PEEK_WIDTH = {
  min: 24,
  // Notion's side peek, 640 pixels.
  initial: 40,
  max: 60,
  step: 1,
} as const;

export function clampWidth(
  width: number,
  bounds: { readonly min: number; readonly max: number },
): number {
  return Math.min(bounds.max, Math.max(bounds.min, width));
}
