import { describe, expect, it } from "vitest";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import { createTestApp, UNDO_COMMAND } from "../../state/index.ts";
import { templateCommands, useTemplate } from "./template.commands.ts";

describe("using a template", () => {
  it("makes a new page of it, with new ids, and opens it", () => {
    const { store, dispatch } = createTestApp({ commands: templateCommands });

    dispatch(useTemplate.create({ templateId: "meeting-notes" }));

    const state = store.getState();
    const page = selectPage(state, state.workspace.rootIds[0] ?? null);
    expect(page === undefined ? "" : selectPageTitle(page)).toBe(
      "Meeting notes",
    );
    expect(page?.childIds).toHaveLength(8);
    expect(state.ui.activePageId).toBe(page?.id);
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createTestApp({ commands: templateCommands });
    dispatch(useTemplate.create({ templateId: "to-do-list" }));

    dispatch({ type: UNDO_COMMAND });

    expect(store.getState().workspace.rootIds).toEqual([]);
  });

  it("does nothing for a template it does not know", () => {
    const { store, dispatch } = createTestApp({ commands: templateCommands });

    dispatch(useTemplate.create({ templateId: "nothing" }));

    expect(store.getState().workspace.rootIds).toEqual([]);
  });
});
