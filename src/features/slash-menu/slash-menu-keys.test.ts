// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { createState } from "./slash-menu-builder.ts";
import { slashMenuKeys } from "./slash-menu.view.ts";

function press(key: string, state: AppState): Command[] {
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const event = new KeyboardEvent("keydown", { key });
  slashMenuKeys.keys[key]?.({ state, dispatch, event });
  return commands;
}

describe("slashMenuKeys", () => {
  it("is active only while the slash menu is open", () => {
    expect(slashMenuKeys.isActive(createState("/", 1))).toBe(true);
    expect(slashMenuKeys.isActive(createInitialState())).toBe(false);
  });

  it("highlights the next item on ArrowDown", () => {
    const [command] = press("ArrowDown", createState("/", 1));

    expect(command).toMatchObject({
      type: "ui.openOverlay",
      overlay: { activeIndex: 1 },
    });
  });

  it("removes the typed query and converts the block on Enter", () => {
    const types = press("Enter", createState("/head", 5)).map((c) => c.type);

    expect(types).toEqual(["ui.closeOverlay", "text.replace", "block.convert"]);
  });

  it("closes the menu on Escape", () => {
    const types = press("Escape", createState("/", 1)).map((c) => c.type);

    expect(types).toEqual(["ui.closeOverlay"]);
  });

  it("colors the block when a color is chosen", () => {
    const types = press("Enter", createState("/blue", 5)).map((c) => c.type);

    expect(types).toEqual([
      "ui.closeOverlay",
      "text.replace",
      "block.setColor",
    ]);
  });

  it("creates a subpage below the block when Page is chosen", () => {
    const sent = press("Enter", createState("/page", 5));

    expect(sent.map((c) => c.type)).toEqual([
      "ui.closeOverlay",
      "text.replace",
      "page.create",
    ]);
    expect(sent[2]).toMatchObject({ parentId: "page", index: 1 });
  });

  it("puts a database in the page when Database is chosen", () => {
    const sent = press("Enter", createState("/datab", 6));

    expect(sent.map((c) => c.type)).toEqual([
      "ui.closeOverlay",
      "text.replace",
      "database.createInline",
    ]);
    expect(sent[2]).toMatchObject({ blockId: "a" });
  });
});
