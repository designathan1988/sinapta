// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { onShareKeydown } from "./share.view.ts";

function recorder() {
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  return { sent, dispatch };
}

function keydown(key: string, target: Element): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe("keys in the Share menu", () => {
  it("closes it on Escape from its email field, focus back on Share", () => {
    document.body.innerHTML =
      '<button id="share" data-overlay-anchor aria-expanded="true">Share</button><div data-overlay><input id="field" /></div>';
    const field = document.getElementById("field");
    if (field === null) throw new Error("no field");
    const { sent, dispatch } = recorder();
    field.addEventListener("keydown", (event) => {
      onShareKeydown(event, dispatch);
    });
    field.focus();

    const event = keydown("Escape", field);

    expect(event.defaultPrevented).toBe(true);
    expect(sent.map((command) => command.type)).toEqual(["ui.closeOverlay"]);
    expect(document.activeElement?.id).toBe("share");
  });

  it("leaves other keys and a used Escape alone", () => {
    document.body.innerHTML = '<input id="field" />';
    const field = document.getElementById("field");
    if (field === null) throw new Error("no field");
    const { sent, dispatch } = recorder();
    field.addEventListener("keydown", (event) => {
      if (event.key === "Escape") event.preventDefault();
      onShareKeydown(event, dispatch);
    });

    keydown("a", field);
    keydown("Escape", field);

    expect(sent).toEqual([]);
  });
});
