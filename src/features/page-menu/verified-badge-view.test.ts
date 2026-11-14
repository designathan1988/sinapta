// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { renderVerifiedBadge } from "./verified-badge.view.ts";

function stateWith(verification?: unknown): AppState {
  const initial = createInitialState();
  const props = {
    title: [{ text: "Policy" }],
    ...(verification === undefined ? {} : { verification }),
  };
  const workspace = buildWorkspace([{ id: "p", props }]);
  const ui = { ...initial.ui, activePageId: toBlockId("p") };
  return { ...initial, workspace, ui };
}

function badgeOf(state: AppState): HTMLElement | null {
  const host = document.createElement("div");
  render(renderVerifiedBadge(state), host);
  return host.querySelector(".page-menu__verified");
}

describe("the verified badge", () => {
  it("shows Verified on a verified page, naming who verified it", () => {
    const badge = badgeOf(
      stateWith({ by: "Ada", at: "2026-11-14T00:00:00.000Z", until: null }),
    );

    expect(badge?.textContent.trim()).toBe("Verified");
    expect(badge?.getAttribute("aria-label")).toBe("Verified by Ada");
  });

  it("is not shown on a page not verified", () => {
    expect(badgeOf(stateWith())).toBeNull();
  });
});
