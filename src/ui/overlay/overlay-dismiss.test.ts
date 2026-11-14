// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  createTestApp,
  openOverlay,
  uiCommands,
  type Command,
} from "../../state/index.ts";
import {
  closeOverlayOnEscape,
  focusOverlayAnchor,
  revealAnchor,
} from "./overlay-dismiss.ts";

// An open overlay and the control that opened it, the focus left on the
// control, as after a click.
function opened() {
  document.body.innerHTML = `<button id="change" data-overlay-anchor aria-expanded="true">Change cover</button>
    <div data-overlay><button id="inside">Gray</button></div>`;
  const app = createTestApp({ commands: uiCommands });
  app.dispatch(
    openOverlay.create({ overlay: { kind: "cover", anchorId: "p" } }),
  );
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  document.body.addEventListener("keydown", (event) => {
    closeOverlayOnEscape(event, app.store, dispatch);
  });
  const control = document.querySelector<HTMLElement>("#change");
  control?.focus();
  return { sent, control };
}

const escape = (target: Element | null) =>
  target?.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );

describe("Escape with an overlay open", () => {
  it("closes it while the focus is still on its control, keeping the focus there", () => {
    const { sent, control } = opened();

    escape(control);

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
    expect(document.activeElement).toBe(control);
  });

  it("leaves a key pressed inside the overlay to the overlay", () => {
    const { sent } = opened();

    escape(document.querySelector("#inside"));

    expect(sent).toEqual([]);
  });
});

describe("an overlay's control cut by the window's edge", () => {
  const control = (left: number, width: number) => {
    const button = document.createElement("button");
    button.getBoundingClientRect = () => new DOMRect(left, 200, width, 32);
    const calls: ScrollIntoViewOptions[] = [];
    button.scrollIntoView = (options?: boolean | ScrollIntoViewOptions) => {
      if (typeof options === "object") calls.push(options);
    };
    return { button, calls };
  };

  it("is scrolled into view first, as Notion shows a new last column", () => {
    const { button, calls } = control(1386, 250);

    revealAnchor(button, 1440);

    expect(calls).toEqual([{ block: "nearest", inline: "nearest" }]);
  });

  it("is left where it is when the window shows all of it", () => {
    const { button, calls } = control(600, 250);

    revealAnchor(button, 1440);

    expect(calls).toEqual([]);
  });
});

describe("focusOverlayAnchor", () => {
  it("gives the focus to the tree row of a control out of the tab order", () => {
    document.body.innerHTML = `<ul role="tree"><li role="treeitem" tabindex="-1" id="row">Page
      <button tabindex="-1" data-overlay-anchor aria-expanded="true">…</button></li></ul>`;

    focusOverlayAnchor({ isWhole: true });

    expect(document.activeElement?.id).toBe("row");
  });

  it("gives it to the open list's control when the overlay has none", () => {
    document.body.innerHTML = `<button id="list" data-overlay-child-anchor aria-expanded="true">Shortcut menu</button>`;

    focusOverlayAnchor({ isWhole: true });

    expect(document.activeElement?.id).toBe("list");
  });
});
