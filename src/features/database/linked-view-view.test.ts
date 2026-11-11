// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { SELECT_OVERLAY } from "../../ui/select/index.ts";
import { renderLinkedView } from "./linked-view.view.ts";

const DATABASE = {
  id: "db",
  type: "database",
  props: {
    title: [{ text: "Tasks" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    properties: [],
    viewIds: [],
  },
};

function rendered(
  linked: Record<string, unknown>,
  withDatabase = true,
  isListOpen = false,
) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "link", type: "linked-view", props: linked }],
    },
    ...(withDatabase ? [DATABASE] : []),
  ]);
  const initial = createInitialState();
  const overlay = isListOpen
    ? { kind: SELECT_OVERLAY, anchorId: "linked-link" }
    : null;
  const state: AppState = {
    ...initial,
    workspace,
    ui: { ...initial.ui, overlay },
  };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderLinkedView(state, dispatch, toBlockId("link")), host);
  return { host, sent };
}

describe("renderLinkedView", () => {
  it("asks which database to show, and shows it", () => {
    const { host, sent } = rendered({ viewIds: [] }, true, true);
    const tasks = [...host.querySelectorAll<HTMLElement>("[role=option]")].find(
      (option) => option.textContent.trim() === "Tasks",
    );

    tasks?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
      expect.objectContaining({
        type: "linkedView.setSource",
        blockId: "link",
        databaseId: "db",
      }),
    ]);
  });

  it("says when the database it showed is gone", () => {
    const { host } = rendered({ databaseId: "gone", viewIds: [] }, false);

    expect(host.textContent).toContain("Database not found");
  });
});
