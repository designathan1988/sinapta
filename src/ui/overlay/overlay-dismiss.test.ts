// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  createTestApp,
  openOverlay,
  uiCommands,
  type Command,
} from "../../state/index.ts";
import { closeOverlayOnEscape } from "./overlay-dismiss.ts";

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
