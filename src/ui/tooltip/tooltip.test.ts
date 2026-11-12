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
});
