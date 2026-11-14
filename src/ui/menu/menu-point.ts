// Where a menu opened at the pointer goes: at the pointer, as Notion's,
// opening upward when the window has no room below and leftward when it
// has none to the right, and never past the window's edges.

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

// Between the menu and the window's edges, as Notion keeps them: 8 px.
const EDGE = 8;

function along(at: number, length: number, room: number): number {
  if (at + length <= room - EDGE) return at;
  const before = at - length;
  return Math.max(EDGE, before >= EDGE ? before : room - length - EDGE);
}

export function menuPointPlace(point: Point, menu: Size, window: Size): Point {
  return {
    x: along(point.x, menu.width, window.width),
    y: along(point.y, menu.height, window.height),
  };
}
