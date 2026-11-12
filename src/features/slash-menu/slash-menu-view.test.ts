// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createState } from "./slash-menu-builder.ts";
import { renderSlashMenu } from "./slash-menu.view.ts";

function rendered(text: string, sent: Command[] = []) {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSlashMenu(createState(text, text.length), (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return host;
}

describe("renderSlashMenu", () => {
  it("lists blocks under Notion's group names", () => {
    const headings = [...rendered("/").querySelectorAll(".slash-menu__group")];

    expect(headings.map((heading) => heading.textContent.trim())).toEqual([
      "Basic blocks",
      "Media",
      "Database",
      "Advanced blocks",
      "Pages",
    ]);
  });

  it("shows each block with its icon and its Markdown shortcut", () => {
    const option = [...rendered("/head").querySelectorAll("[role=option]")][0];

    expect(
      option?.querySelector("[data-icon]")?.getAttribute("data-icon"),
    ).toBe("heading-1");
    expect(option?.querySelector(".slash-menu__hint")?.textContent).toBe("#");
  });

  it("ends with Close menu and its key, which closes it, as Notion's", () => {
    const sent: Command[] = [];
    const footer = rendered("/", sent).querySelector(".slash-menu__footer");

    footer?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(footer?.textContent.replace(/\s+/g, " ").trim()).toBe(
      "Close menu esc",
    );
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });
});
