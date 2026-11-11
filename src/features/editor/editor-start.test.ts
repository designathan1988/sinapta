// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderStartList } from "./editor-start.view.ts";

function rendered(children: { id: string }[]) {
  const props = { title: [], icon: null, isFavorite: false, isTrashed: false };
  const state = {
    ...createInitialState(),
    workspace: buildWorkspace([{ id: "page", props, children }]),
  };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderStartList(toBlockId("page"), { state, dispatch }), host);
  return { host, commands };
}

describe("renderStartList", () => {
  it("offers to start an empty page as a board", () => {
    const { host, commands } = rendered([]);
    const board = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Board",
    );

    board?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "database.startFromPage",
        pageId: "page",
        viewType: "board",
      }),
    ]);
  });

  it("offers nothing once the page has content", () => {
    expect(rendered([{ id: "text" }]).host.querySelector("button")).toBeNull();
  });
});
