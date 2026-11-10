import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";
import { HISTORY_LIMIT, REDO_COMMAND, UNDO_COMMAND } from "./history.ts";
import { setTheme } from "./settings.commands.ts";
import { addTestBlock, createTestApp } from "./state-builder.ts";
import { toggleSidebar } from "./ui.commands.ts";

function createApp() {
  return createTestApp({ commands: [addTestBlock, setTheme, toggleSidebar] });
}

const addPage = addTestBlock.create({ blockType: "page" });

// A recorded change that asks to be merged with its neighbors.
const typeLetter = defineCommand<{ theme: "light" | "dark" }>({
  type: "test.type",
  handle: (state, command) => ({
    mergeKey: "typing",
    operations: [
      {
        type: "record.update",
        kind: "block",
        id: toBlockId("a"),
        patch: { props: { theme: command.theme } },
      },
    ],
  }),
});

describe("history", () => {
  it("undoes a workspace command", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;
    dispatch(addPage);

    dispatch({ type: UNDO_COMMAND });

    expect(store.getState().workspace).toEqual(before);
  });

  it("redoes an undone command", () => {
    const { store, dispatch } = createApp();
    dispatch(addPage);
    const after = store.getState().workspace;
    dispatch({ type: UNDO_COMMAND });

    dispatch({ type: REDO_COMMAND });

    expect(store.getState().workspace).toEqual(after);
  });

  it("undoes several commands in reverse order", () => {
    const { store, dispatch } = createApp();
    dispatch(addPage);
    dispatch(addPage);

    dispatch({ type: UNDO_COMMAND });

    expect(store.getState().workspace.rootIds).toEqual(["new-1"]);
  });

  it("clears redo after a new command", () => {
    const { store, dispatch } = createApp();
    dispatch(addPage);
    dispatch({ type: UNDO_COMMAND });

    dispatch(addPage);

    expect(store.getState().history.redo).toEqual([]);
  });

  it("does not record a command that changes only the interface", () => {
    const { store, dispatch } = createApp();

    dispatch(toggleSidebar.create({}));

    expect(store.getState().history.undo).toEqual([]);
  });

  it("does not record a settings change", () => {
    const { store, dispatch } = createApp();

    dispatch(setTheme.create({ theme: "dark" }));

    expect(store.getState().history.undo).toEqual([]);
    expect(store.getState().workspace.settings.theme).toBe("dark");
  });

  it("does nothing when there is nothing to undo", () => {
    const { store, dispatch } = createApp();
    const before = store.getState();

    dispatch({ type: UNDO_COMMAND });

    expect(store.getState()).toBe(before);
  });

  it("keeps at most the limit of entries", () => {
    const { store, dispatch } = createApp();

    for (let count = 0; count <= HISTORY_LIMIT; count += 1) dispatch(addPage);

    expect(store.getState().history.undo).toHaveLength(HISTORY_LIMIT);
  });

  it("merges transactions with the same key into one undo step", () => {
    const { store, dispatch } = createTestApp({
      workspace: buildWorkspace([{ id: "a" }]),
      commands: [typeLetter],
    });
    const before = store.getState().workspace;

    dispatch(typeLetter.create({ theme: "light" }));
    dispatch(typeLetter.create({ theme: "dark" }));

    expect(store.getState().history.undo).toHaveLength(1);
    dispatch({ type: UNDO_COMMAND });
    expect(store.getState().workspace).toEqual(before);
  });
});
