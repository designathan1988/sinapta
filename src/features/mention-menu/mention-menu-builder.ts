// Builds a page whose paragraph has a mention menu open in it, for the
// mention menu's tests.
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";

export const A = toBlockId("a");
export const TODAY = "2026-11-11";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

// `text` is the paragraph's text, the caret at its end; `start` is where
// the "@" or "[[" is.
export function createState(text: string, kind: string, start = 0): AppState {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: page("Journal"),
      children: [{ id: "a", type: "paragraph", props: { text: [{ text }] } }],
    },
    { id: "plan", props: page("Roadmap plan") },
    { id: "gone", props: page("Old plan", true) },
  ]);
  const initial = createInitialState();
  const caret = text.length;
  const ui = {
    ...initial.ui,
    selection: { blockId: A, anchorOffset: caret, focusOffset: caret },
    overlay: { kind, anchorId: A, start },
  };
  return { ...initial, workspace, ui };
}
