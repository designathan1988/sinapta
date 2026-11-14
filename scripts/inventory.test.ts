import { describe, expect, it } from "vitest";
import { commandsUsed, keysHandled } from "./inventory-code.ts";
import { moduleOf } from "./inventory-source.ts";
import { controlsIn } from "./inventory-templates.ts";

describe("the inventory", () => {
  it("names the part of the app a file belongs to", () => {
    expect(moduleOf("src/features/sidebar/sidebar.view.ts")).toBe(
      "features/sidebar",
    );
    expect(moduleOf("src/features/database/view-settings/a.ts")).toBe(
      "features/database/view-settings",
    );
    expect(moduleOf("src/app/main.ts")).toBe("app");
    expect(moduleOf("src/blocks/block-registry.ts")).toBe("blocks");
    expect(moduleOf("server/routes.ts")).toBe("server");
  });

  it("reads controls from templates, arrow functions and all", () => {
    const view = [
      'html`<div class="list">',
      '<button type="button" class="menu__item" data-action="add"',
      "  aria-label=${COPY.sidebar.addSubpage} @click=${() => go(a > b)}>",
      "  ${label}</button><span>plain</span></div>`",
    ].join("\n");
    const [control, ...rest] = controlsIn(view, "a.view.ts");
    expect(rest).toEqual([]);
    expect(control).toMatchObject({
      tag: "button",
      kind: "menu__item",
      label: "COPY.sidebar.addSubpage",
      events: ["click"],
    });
    expect(control?.attrs).toContain("data-action=add");
  });

  it("finds the commands a file dispatches, by type or by factory", () => {
    const names = new Map([["toggleSidebar", "ui.toggleSidebar"]]);
    const text =
      'dispatch(toggleSidebar.create({})); dispatch({ type: "page.move" });';
    expect(commandsUsed(text, names)).toEqual([
      "page.move",
      "ui.toggleSidebar",
    ]);
  });

  it("lists the keys a keyboard handler checks", () => {
    const text =
      'onKeydown(e) { if (e.key === "Escape" || (e.shiftKey && e.key === "ArrowUp")) }';
    expect(keysHandled(text)).toEqual(["ArrowUp", "Escape", "shiftKey"]);
  });
});
