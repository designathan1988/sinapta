// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { onRowContextMenu } from "./table-context-menu.view.ts";

function rightClick(init: MouseEventInit) {
  const body = document.createElement("tbody");
  body.innerHTML = `<tr><td data-cell="row1:title">Task</td></tr>`;
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  body.addEventListener("contextmenu", (event) => {
    onRowContextMenu(event, dispatch);
  });
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  body.querySelector("td")?.dispatchEvent(event);
  return { commands, event };
}

describe("onRowContextMenu", () => {
  it("opens the row page's menu at the pointer", () => {
    const { commands, event } = rightClick({ clientX: 7, clientY: 8 });

    expect(event.defaultPrevented).toBe(true);
    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: "page-menu",
          anchorId: "row:row1",
          point: { x: 7, y: 8 },
        },
      }),
    ]);
  });

  it("opens it under the cell when the keyboard asks for it", () => {
    const { commands } = rightClick({});

    expect(commands[0]).toMatchObject({
      overlay: { kind: "page-menu", point: { x: 0, y: 0 } },
    });
  });
});
