// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../../state/index.ts";
import { renderInbox } from "./inbox.view.ts";

function mount() {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderInbox(createInitialState(), () => ({ ok: true })),
    host,
  );
  return host;
}

describe("the inbox's panel", () => {
  it("flies out beside the sidebar, as Notion's, not over a dimmed page", () => {
    const host = mount();

    expect(host.querySelector("dialog")?.dataset.variant).toBe("flyout");
  });

  it("heads its panel with its own title and a close button", () => {
    const host = mount();

    const header = host.querySelector(".inbox__header");

    expect(header?.textContent).toContain("Inbox");
    expect(header?.querySelector("button[aria-label='Close inbox']")).not.toBe(
      null,
    );
  });
});
