import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId, type PageAccess } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";
import {
  selectBlockAccess,
  selectIsEditable,
} from "./page-access.selectors.ts";
import { createTestApp } from "./state-builder.ts";
import { loadServerWorkspace } from "./sync.commands.ts";

const workspace = buildWorkspace([
  {
    id: "shared",
    props: { title: [] },
    children: [{ id: "inner", props: { text: [{ text: "Hi" }] } }],
  },
]);

const rename = defineCommand<{ text: string }>({
  type: "test.rename",
  handle: (state, { text }) => {
    const id = toBlockId("inner");
    const block = state.workspace.blocks[id];
    if (block === undefined) return {};
    const props = { ...block.props, text: [{ text }] };
    return {
      operations: [
        { type: "record.update", kind: "block", id, patch: { props } },
      ],
    };
  },
});

function guestApp(access: PageAccess) {
  const app = createTestApp({ commands: [rename, loadServerWorkspace] });
  app.dispatch(
    loadServerWorkspace.create({ workspace, access: { shared: access } }),
  );
  return app;
}

describe("page access", () => {
  it("gives a member every page in full", () => {
    const { store } = createTestApp({ workspace });

    expect(selectBlockAccess(store.getState(), toBlockId("inner"))).toBe(
      "full",
    );
  });

  it("gives the blocks inside a shared page the page's access", () => {
    const { store } = guestApp("view");

    expect(selectBlockAccess(store.getState(), toBlockId("inner"))).toBe(
      "view",
    );
    expect(selectIsEditable(store.getState(), toBlockId("inner"))).toBe(false);
  });

  it("refuses a guest's edit on a page they may only view", () => {
    const { dispatch } = guestApp("view");

    expect(dispatch(rename.create({ text: "Bye" }))).toMatchObject({
      ok: false,
      error: { kind: "read-only" },
    });
  });

  it("applies a guest's edit on a page they may edit", () => {
    const { store, dispatch } = guestApp("edit");

    expect(dispatch(rename.create({ text: "Bye" }))).toEqual({ ok: true });
    expect(
      store.getState().workspace.blocks[toBlockId("inner")]?.props.text,
    ).toEqual([{ text: "Bye" }]);
  });
});
