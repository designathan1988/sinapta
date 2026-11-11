// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createState } from "./slash-menu-builder.ts";
import { renderSlashMenu } from "./slash-menu.view.ts";

// happy-dom has no Popover API; the menu only needs to be shown.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

function rendered(text: string) {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSlashMenu(createState(text, text.length), () => ({ ok: true })),
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
});
