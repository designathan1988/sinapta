// The row peek: closing it, opening its row as its own page, and stepping
// to the next or previous row in the order of the view it came from.
import { selectPage } from "../../blocks/page/index.ts";
import type { BlockId, View, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { selectPeekRows } from "./peek.selectors.ts";

export const closePeek = defineCommand<Record<string, never>>({
  type: "peek.close",
  handle: (state) =>
    state.ui.peek === null ? {} : { ui: { ...state.ui, peek: null } },
});

export const expandPeek = defineCommand<Record<string, never>>({
  type: "peek.expand",
  handle(state) {
    const { peek } = state.ui;
    if (peek === null) return {};
    return {
      ui: {
        ...state.ui,
        peek: null,
        activePageId: peek.pageId,
        activeCell: null,
      },
    };
  },
});

export const stepPeek = defineCommand<{ by: number }>({
  type: "peek.step",
  handle(state, command) {
    const { peek } = state.ui;
    if (peek === null) return {};
    const rows = selectPeekRows(state);
    const index = rows.indexOf(peek.pageId);
    const nextId =
      rows[Math.min(rows.length - 1, Math.max(0, index + command.by))];
    const next = selectPage(state, nextId ?? null);
    if (next === undefined || index === -1) return {};
    return { ui: { ...state.ui, peek: { ...peek, pageId: next.id } } };
  },
});

// Notion's peek mode switch: side or center keeps the peek and moves it;
// full page opens the row. The view remembers the choice for next time.
export const setPeekMode = defineCommand<{ mode: View["openMode"] }>({
  type: "peek.setMode",
  handle(state, command) {
    const { peek } = state.ui;
    const view = peek === null ? undefined : state.workspace.views[peek.viewId];
    if (peek === null || view === undefined) return {};
    const { mode } = command;
    const ui =
      mode === "full"
        ? {
            ...state.ui,
            peek: null,
            activePageId: peek.pageId,
            activeCell: null,
          }
        : { ...state.ui, peek: { ...peek, mode } };
    const patch = { openMode: mode };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
      ui,
    };
  },
});

// Opens a row in a peek as an address names it: the row, the view whose
// order it follows, and how it shows.
export const openPeek = defineCommand<{
  peek: { pageId: BlockId; viewId: ViewId; mode: "side" | "center" };
}>({
  type: "peek.open",
  handle(state, { peek }) {
    if (state.workspace.blocks[peek.pageId] === undefined) return {};
    return { ui: { ...state.ui, peek } };
  },
});

export const peekCommands = [
  closePeek,
  expandPeek,
  stepPeek,
  setPeekMode,
  openPeek,
];
