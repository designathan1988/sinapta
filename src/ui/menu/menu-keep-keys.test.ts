// @vitest-environment happy-dom
import { html, render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderMenu } from "./menu.view.ts";

async function settled(): Promise<void> {
  for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
}

describe("a panel with nothing to choose", () => {
  it("gives its Back button the keys, so arrows and Escape still work", async () => {
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderMenu({
        label: "Automations",
        title: "Automations",
        items: [],
        lead: html`<p>Edit properties automatically</p>`,
        onBack: () => undefined,
        onClose: () => undefined,
      }),
      host,
    );
    await settled();

    expect(document.activeElement?.className).toBe("menu__back");
  });

  it("leaves the focus where a row of its own took it", async () => {
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderMenu({
        label: "Period",
        title: "Period",
        items: [{ label: "Last 7 days", onSelect: () => undefined }],
        onClose: () => undefined,
      }),
      host,
    );
    await settled();

    expect(document.activeElement?.textContent).toContain("Last 7 days");
  });
});
