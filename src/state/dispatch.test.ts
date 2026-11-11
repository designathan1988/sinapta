import { describe, expect, it, vi } from "vitest";
import { buildWorkspace, TEST_TIME, toBlockId } from "../model/index.ts";
import { defineCommand, type NoPayload } from "./command-registry.ts";
import { addTestBlock, createTestApp } from "./state-builder.ts";
import { setReadOnly } from "./persistence.commands.ts";
import { toggleSidebar } from "./ui.commands.ts";
import { loadWorkspace } from "./workspace.commands.ts";

const brokenCommand = defineCommand<NoPayload>({
  type: "test.broken",
  handle: () => ({
    operations: [
      {
        type: "list.insert",
        list: { kind: "rootIds" },
        id: toBlockId("ghost"),
        index: 0,
      },
    ],
  }),
});

describe("dispatch", () => {
  it("applies a command and notifies subscribers once", () => {
    const { store, dispatch } = createTestApp({ commands: [addTestBlock] });
    const listener = vi.fn();
    store.subscribe(listener);

    const result = dispatch(addTestBlock.create({ blockType: "page" }));

    expect(result).toEqual({ ok: true });
    expect(listener).toHaveBeenCalledOnce();
    expect(store.getState().workspace.rootIds).toEqual(["new-1"]);
  });

  it("gives the handler its ids and the current time", () => {
    const { store, dispatch } = createTestApp({ commands: [addTestBlock] });

    dispatch(addTestBlock.create({ blockType: "page" }));

    const block = store.getState().workspace.blocks[toBlockId("new-1")];
    expect(block?.createdAt).toBe(TEST_TIME);
  });

  it("changes nothing when the transaction breaks an invariant", () => {
    const { store, dispatch } = createTestApp({ commands: [brokenCommand] });
    const before = store.getState();
    const listener = vi.fn();
    store.subscribe(listener);

    const result = dispatch(brokenCommand.create({}));

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "invariant-broken" },
    });
    expect(store.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("returns an error for a command type nobody registered", () => {
    const { dispatch } = createTestApp();

    expect(dispatch({ type: "nobody.home" })).toEqual({
      ok: false,
      error: { kind: "unknown-command", type: "nobody.home" },
    });
  });

  it("throws when a subscriber dispatches during notification", () => {
    const { store, dispatch } = createTestApp({ commands: [toggleSidebar] });
    store.subscribe(() => dispatch(toggleSidebar.create({})));

    expect(() => dispatch(toggleSidebar.create({}))).toThrow(/notified/);
  });

  it("accepts a dispatch after a subscriber threw", () => {
    const { store, dispatch } = createTestApp({ commands: [toggleSidebar] });
    const unsubscribe = store.subscribe(() => {
      throw new Error("listener failed");
    });
    expect(() => dispatch(toggleSidebar.create({}))).toThrow("listener failed");
    unsubscribe();

    expect(dispatch(toggleSidebar.create({}))).toEqual({ ok: true });
  });

  it("does not notify when a command changes nothing", () => {
    const { store, dispatch } = createTestApp({
      commands: [defineCommand({ type: "test.noop", handle: () => ({}) })],
    });
    const listener = vi.fn();
    store.subscribe(listener);

    dispatch({ type: "test.noop" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("refuses a payload with a field that would replace the command type", () => {
    const command = defineCommand<{ type: string }>({
      type: "test.clash",
      handle: () => ({}),
    });

    expect(() => command.create({ type: "other" })).toThrow(/named "type"/);
  });
});

describe("dispatch in a read-only tab", () => {
  function readOnlyApp() {
    const app = createTestApp({
      commands: [addTestBlock, toggleSidebar, setReadOnly, loadWorkspace],
    });
    app.dispatch(setReadOnly.create({ isReadOnly: true }));
    return app;
  }

  it("refuses a change to workspace data and keeps the state", () => {
    const { store, dispatch } = readOnlyApp();
    const before = store.getState();

    const result = dispatch(addTestBlock.create({ blockType: "page" }));

    expect(result).toEqual({ ok: false, error: { kind: "read-only" } });
    expect(store.getState()).toBe(before);
  });

  it("still applies interface commands", () => {
    const { store, dispatch } = readOnlyApp();

    expect(dispatch(toggleSidebar.create({})).ok).toBe(true);
    expect(store.getState().ui.isSidebarCollapsed).toBe(true);
  });

  it("still loads the workspace another tab saved", () => {
    const { store, dispatch } = readOnlyApp();
    const workspace = buildWorkspace([{ id: "saved" }]);
    const ui = store.getState().ui;

    const result = dispatch(
      loadWorkspace.create({ workspace, ui, skippedCount: 0 }),
    );

    expect(result.ok).toBe(true);
    expect(store.getState().workspace.rootIds).toEqual(["saved"]);
  });
});
