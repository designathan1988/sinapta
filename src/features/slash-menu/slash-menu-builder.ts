// Builds a page with one paragraph and the slash menu open in it, for the
// slash menu's tests.
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { SLASH_MENU_OVERLAY } from "./slash-menu.selectors.ts";

export const A = toBlockId("a");

export function createState(text: string, caret: number, start = 0): AppState {
  const page = {
    title: [{ text: "Roadmap" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
  };
  const workspace = buildWorkspace([
    {
      id: "page",
      props: page,
      children: [{ id: "a", type: "paragraph", props: { text: [{ text }] } }],
    },
  ]);
  const state = createInitialState();
  const ui = {
    ...state.ui,
    selection: { blockId: A, anchorOffset: caret, focusOffset: caret },
    overlay: { kind: SLASH_MENU_OVERLAY, anchorId: A, start },
  };
  return { ...state, workspace, ui };
}
