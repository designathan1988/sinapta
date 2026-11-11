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

function rendered(linked: Record<string, unknown>, withDatabase = true) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "link", type: "linked-view", props: linked }],
    },
    ...(withDatabase ? [DATABASE] : []),
  ]);
  const state: AppState = { ...createInitialState(), workspace };
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
    const { host, sent } = rendered({ viewIds: [] });
    const select = host.querySelector("select");
    if (select === null) throw new Error("no choice");

    select.value = "db";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toEqual([
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
