// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, type BlockSpec } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { MOVE_TO_OVERLAY, renderMoveTo } from "./move-to.view.ts";

function page(id: string, title: string, children: BlockSpec[] = []) {
  const props = {
    title: [{ text: title }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
  };
  return { id, props, children };
}

function rendered() {
  const workspace = buildWorkspace([
    page("home", "Home", [{ id: "a", type: "paragraph", props: { text: [] } }]),
    page("notes", "Notes"),
  ]);
  const initial = createInitialState();
  const overlay = { kind: MOVE_TO_OVERLAY, anchorId: "a" };
  const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderMoveTo(state, dispatch), host);
  const options = [
    ...host.querySelectorAll<HTMLElement>("button.move-to__option"),
  ];
  return { options, sent };
}

describe("moving a block to another page", () => {
  it("offers every page but the block's own", () => {
    const labels = rendered().options.map((o) => o.textContent.trim());

    expect(labels).toEqual(["Notes"]);
  });

  it("moves the block to the chosen page", () => {
    const { options, sent } = rendered();

    options[0]?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "block.moveToPage",
      "ui.closeOverlay",
    ]);
    expect(sent[0]).toMatchObject({ blockIds: ["a"], pageId: "notes" });
  });
});
