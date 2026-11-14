// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { installTooltip } from "./tooltip.ts";

function showInterest(hint: Element, source: Element | null): Event {
  const event = new Event("interest", { cancelable: true });
  Object.defineProperty(event, "source", { value: source });
  hint.dispatchEvent(event);
  return event;
}

describe("installTooltip", () => {
  it("gives the hint the name of the control that asked for it", () => {
    document.body.innerHTML = `<button aria-label="Open settings"></button>
      <div id="tooltip"></div><div id="other"></div>`;
    const hint = document.querySelector("#tooltip");
    const other = document.querySelector("#other");
    const button = document.querySelector("button");
    if (hint === null || other === null) throw new Error("setup");
    installTooltip();

    showInterest(hint, button);
    showInterest(other, button);

    expect(hint.textContent).toBe("Open settings");
    expect(other.textContent).toBe("");
  });

  it("takes the words a labelled control asks for, and shows nothing empty", () => {
    document.body.innerHTML = `<button data-tooltip="Open page history">Edited now</button>
      <button>Plain</button><div id="tooltip"></div>`;
    const hint = document.querySelector("#tooltip");
    const [history, plain] = document.querySelectorAll("button");
    if (hint === null) throw new Error("setup");
    installTooltip();

    const shown = showInterest(hint, history ?? null);
    const words = hint.textContent;
    const empty = showInterest(hint, plain ?? null);

    expect(words).toBe("Open page history");
    expect(shown.defaultPrevented).toBe(false);
    expect(empty.defaultPrevented).toBe(true);
  });

  it("says nothing over a control whose menu is open", () => {
    document.body.innerHTML = `<button aria-label="View settings" aria-expanded="true"></button>
      <div id="tooltip"></div>`;
    const hint = document.querySelector("#tooltip");
    if (hint === null) throw new Error("setup");
    installTooltip();

    const shown = showInterest(hint, document.querySelector("button"));

    expect(shown.defaultPrevented).toBe(true);
  });

  it("names an open toggle's arrow, which is no menu", () => {
    document.body.innerHTML = `<button aria-label="Hide content" aria-expanded="true" data-disclosure></button>
      <div id="tooltip"></div>`;
    const hint = document.querySelector("#tooltip");
    if (hint === null) throw new Error("setup");
    installTooltip();

    const shown = showInterest(hint, document.querySelector("button"));

    expect(shown.defaultPrevented).toBe(false);
    expect(hint.textContent).toBe("Hide content");
  });

  it("puts an open hint away when the person presses", () => {
    document.body.innerHTML = `<button aria-label="View settings"></button>
      <div id="tooltip" popover="manual"></div>`;
    const hint = document.querySelector<HTMLElement>("#tooltip");
    if (hint === null) throw new Error("setup");
    installTooltip();
    hint.showPopover();

    document
      .querySelector("button")
      ?.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(hint.matches(":popover-open")).toBe(false);
  });
});
