// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { toggleSidebarKeepingFocus } from "./sidebar-focus.ts";

// A dispatch that draws what the shell would: the sidebar or the button
// that brings it back, never both.
function shell(isShown: boolean) {
  const sent: Command[] = [];
  let shown = isShown;
  const draw = (): void => {
    document.body.innerHTML = shown
      ? '<nav class="app__sidebar"><div class="sidebar__top"><button id="hide">Hide</button></div></nav>'
      : '<span data-sidebar-open><button id="show">Show</button></span><main><button id="other">Other</button></main>';
  };
  draw();
  const dispatch = (command: Command) => {
    sent.push(command);
    shown = !shown;
    draw();
    return { ok: true } as const;
  };
  return { sent, dispatch };
}

describe("hiding and showing the sidebar", () => {
  it("gives the focus to Show sidebar when it was in the sidebar", async () => {
    const { sent, dispatch } = shell(true);
    document.getElementById("hide")?.focus();

    toggleSidebarKeepingFocus(dispatch);
    await Promise.resolve();

    expect(sent.map((command) => command.type)).toEqual(["ui.toggleSidebar"]);
    expect(document.activeElement?.id).toBe("show");
  });

  it("gives it to Hide sidebar when it was on Show sidebar", async () => {
    const { dispatch } = shell(false);
    document.getElementById("show")?.focus();

    toggleSidebarKeepingFocus(dispatch);
    await Promise.resolve();

    expect(document.activeElement?.id).toBe("hide");
  });

  it("leaves the focus alone when it was elsewhere", async () => {
    const { dispatch } = shell(false);
    document.getElementById("other")?.focus();

    toggleSidebarKeepingFocus(dispatch);
    await Promise.resolve();

    expect(document.activeElement?.id).not.toBe("hide");
  });
});
