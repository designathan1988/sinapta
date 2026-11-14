// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, parseBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import {
  renderBlockPresence,
  renderPresence,
  selectCaretsIn,
} from "./presence.view.ts";

function stateOnPage(): AppState {
  const state = createInitialState();
  const pageId = parseBlockId("p1") ?? null;
  return {
    ...state,
    workspace: buildWorkspace([{ id: "p1" }]),
    ui: { ...state.ui, activePageId: pageId },
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-in",
        user: { id: "me", email: "me@pagecraft.test", name: "Me", photo: null },
      },
      sync: {
        ...state.persistence.sync,
        presence: [
          { userId: "me", name: "Me", pageId: "p1", blockId: "b1" },
          {
            userId: "u2",
            name: "Grace",
            pageId: "p1",
            blockId: "b1",
            offset: 4,
          },
          { userId: "u3", name: "Linus", pageId: "elsewhere", blockId: null },
        ],
      },
    },
  };
}

describe("presence", () => {
  it("shows the others on this page, not this person nor the others elsewhere", () => {
    const host = document.createElement("div");

    render(renderPresence(stateOnPage()), host);

    expect(
      [...host.querySelectorAll(".presence__face")].map(
        (face) => face.textContent,
      ),
    ).toEqual(["G"]);
    expect(host.querySelector(".presence")?.getAttribute("aria-label")).toBe(
      "Also on this page: Grace",
    );
  });
});

describe("block presence", () => {
  it("shows the others writing in a block beside it, named", () => {
    const host = document.createElement("div");

    render(renderBlockPresence(stateOnPage(), "b1"), host);

    const face = host.querySelector(".presence__block");
    expect(face?.textContent).toBe("G");
    expect(face?.getAttribute("aria-label")).toBe("Writing here: Grace");
  });

  it("shows nothing beside a block no one else writes in", () => {
    const host = document.createElement("div");

    render(renderBlockPresence(stateOnPage(), "b2"), host);

    expect(host.querySelector(".presence__block")).toBeNull();
  });
});

describe("the others' carets", () => {
  it("lists each other person's caret in a block, where it is", () => {
    expect(selectCaretsIn(stateOnPage(), "b1")).toEqual([
      { name: "Grace", offset: 4 },
    ]);
  });
});
