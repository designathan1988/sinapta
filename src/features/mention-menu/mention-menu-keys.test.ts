// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { AppState, Command, Dispatch } from "../../state/index.ts";
import { createState } from "./mention-menu-builder.ts";
import { MENTION_MENU_OVERLAY } from "./mention-menu.selectors.ts";
import { mentionMenuKeys } from "./mention-menu.view.ts";

function press(key: string, state: AppState): Command[] {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const event = new KeyboardEvent("keydown", { key });
  mentionMenuKeys.keys[key]?.({ state, dispatch, event });
  return sent;
}

describe("mentionMenuKeys", () => {
  const state = createState("see @road", MENTION_MENU_OVERLAY, 4);

  it("applies while the mention menu is open", () => {
    expect(mentionMenuKeys.isActive(state)).toBe(true);
  });

  it("puts the chosen page in place of what was typed on Enter", () => {
    const sent = press("Enter", state);

    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeOverlay",
      "text.insertMention",
    ]);
    expect(sent[1]).toMatchObject({ start: 4, end: 9 });
  });

  it("closes on Escape and leaves the typed text", () => {
    expect(press("Escape", state).map((c) => c.type)).toEqual([
      "ui.closeOverlay",
    ]);
  });
});
