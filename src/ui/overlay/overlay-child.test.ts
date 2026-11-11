// @vitest-environment happy-dom
import { html, render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createTestApp,
  openChildOverlay,
  openOverlay,
  uiCommands,
  type Command,
} from "../../state/index.ts";
import { childDepthOf, popoverSourceOf } from "./overlay-child.ts";
import {
  installOverlayDismiss,
  showPopoverWhenConnected,
} from "./overlay-dismiss.ts";

// A menu with a submenu open, and a submenu open inside that one.
function nested(): HTMLElement {
  const host = document.createElement("div");
  render(
    html`<div data-overlay class="menu">
      <button id="edit" data-overlay-child-anchor aria-expanded="true">
        Edit
      </button>
      <div data-overlay data-child id="edit-menu">
        <button id="format" data-overlay-child-anchor aria-expanded="true">
          Format
        </button>
        <div data-overlay data-child id="format-menu">
          <button id="euro">Euro</button>
        </div>
        <button id="decimals">Decimals</button>
      </div>
      <button id="hide">Hide</button>
    </div>`,
    host,
  );
  document.body.replaceChildren(host);
  return host;
}

function element(host: HTMLElement, id: string): HTMLElement {
  const found = host.querySelector<HTMLElement>(`#${id}`);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

describe("childDepthOf", () => {
  it("counts the submenus a control sits in", () => {
    const host = nested();

    expect(childDepthOf(element(host, "hide"))).toBe(0);
    expect(childDepthOf(element(host, "decimals"))).toBe(1);
    expect(childDepthOf(element(host, "euro"))).toBe(2);
  });
});

describe("popoverSourceOf", () => {
  it("finds the control a submenu follows", () => {
    const host = nested();

    expect(popoverSourceOf(element(host, "format-menu"))).toBe(
      element(host, "format"),
    );
    expect(popoverSourceOf(element(host, "euro"))).toBeUndefined();
  });
});

describe("installOverlayDismiss", () => {
  it("closes only the submenus deeper than a press inside the menus", () => {
    const host = nested();
    const app = createTestApp({ commands: uiCommands });
    const overlay = { kind: "column-menu", anchorId: "p1" };
    app.dispatch(openOverlay.create({ overlay }));
    app.dispatch(openChildOverlay.create({ anchorId: "edit" }));
    app.dispatch(openChildOverlay.create({ anchorId: "format", depth: 1 }));
    const sent: Command[] = [];
    installOverlayDismiss(app.store, (command) => {
      sent.push(command);
      return { ok: true };
    });

    element(host, "decimals").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    element(host, "format").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeChildOverlay", depth: 1 }),
    ]);
  });
});

describe("showPopoverWhenConnected", () => {
  it("shows a popover and focuses its field once, however often it renders", () => {
    const host = document.createElement("div");
    render(
      html`<div popover="manual"><input data-autofocus /></div>
        <button>Elsewhere</button>`,
      host,
    );
    document.body.replaceChildren(host);
    const popover = host.querySelector("[popover]") ?? undefined;
    const elsewhere = host.querySelector("button");

    showPopoverWhenConnected(popover);
    elsewhere?.focus();
    showPopoverWhenConnected(popover);

    expect(popover?.matches(":popover-open")).toBe(true);
    expect(document.activeElement).toBe(elsewhere);
  });

  it("leaves focus where it is for a submenu opened under the pointer", () => {
    const host = document.createElement("div");
    render(
      html`<button data-overlay-child-anchor aria-expanded="true">Sort</button>
        <div popover="manual" data-overlay data-child data-placement="beside">
          <button data-autofocus>Ascending</button>
        </div>`,
      host,
    );
    document.body.replaceChildren(host);
    const row = host.querySelector("button");
    const submenu = host.querySelector("[popover]") ?? undefined;
    if (row === null) throw new Error("no row");
    row.focus();
    // happy-dom keeps no pointer: the row says it is under it.
    Object.defineProperty(row, "matches", {
      value: (selector: string) =>
        selector === ":hover" || row.closest(selector) === row,
    });

    showPopoverWhenConnected(submenu);

    expect(document.activeElement).toBe(row);
  });
});
