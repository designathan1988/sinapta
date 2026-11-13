// Where the selection panel goes: under the selected text, its middle
// over the text's middle; over the text when the window has no room
// below; and moved in so it never leaves the window.

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

// Between the text and the panel, and between the panel and the window's
// edges, as Notion keeps them: 8 px.
const GAP = 8;

export function panelPlace(
  text: Box,
  panel: Size,
  window: Size,
): { readonly x: number; readonly y: number } {
  const middle = text.left + text.width / 2 - panel.width / 2;
  const x = Math.min(
    Math.max(GAP, middle),
    Math.max(GAP, window.width - panel.width - GAP),
  );
  const below = text.top + text.height + GAP;
  const above = text.top - panel.height - GAP;
  const fitsBelow = below + panel.height <= window.height - GAP;
  const y = fitsBelow || above < GAP ? below : above;
  return { x, y };
}
