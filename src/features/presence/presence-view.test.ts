// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, parseBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { renderPresence } from "./presence.view.ts";

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
          { userId: "me", name: "Me", pageId: "p1" },
          { userId: "u2", name: "Grace", pageId: "p1" },
          { userId: "u3", name: "Linus", pageId: "elsewhere" },
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
