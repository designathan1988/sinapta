// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState, type Command } from "../../state/index.ts";
import {
  renderTemplateGallery,
  TEMPLATE_GALLERY_OVERLAY,
} from "./template-gallery.view.ts";

function rendered(activeIndex = 0) {
  const initial = createInitialState();
  const overlay = { kind: TEMPLATE_GALLERY_OVERLAY, activeIndex };
  const state = { ...initial, ui: { ...initial.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderTemplateGallery(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const items = [
    ...host.querySelectorAll<HTMLElement>(".template-gallery__item"),
  ];
  return { host, sent, items };
}

function press(target: Element | undefined, key: string): void {
  target?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("the template gallery", () => {
  it("groups its templates by kind, as Notion's", () => {
    const { host, items } = rendered();

    const groups = [
      ...host.querySelectorAll(".template-gallery__group-name"),
    ].map((name) => name.textContent.trim());

    expect(groups).toEqual(["Work", "Personal"]);
    expect(items[0]?.textContent).toContain("Meeting notes");
  });

  it("moves through the templates with the arrow keys", () => {
    const { sent, items } = rendered(1);

    press(items[1], "ArrowDown");
    press(items[1], "ArrowUp");
    press(items[1], "End");

    expect(sent).toMatchObject([
      { overlay: { activeIndex: 2 } },
      { overlay: { activeIndex: 0 } },
      { overlay: { activeIndex: items.length - 1 } },
    ]);
  });

  it("puts the button that uses the template above its preview", () => {
    const { host } = rendered();
    const preview = host.querySelector(".template-gallery__preview");

    expect(preview?.firstElementChild?.className).toBe(
      "template-gallery__actions",
    );
  });
});
