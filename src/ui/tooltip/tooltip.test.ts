// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { installTooltip } from "./tooltip.ts";

function showInterest(hint: Element, source: Element | null): void {
  const event = new Event("interest");
  Object.defineProperty(event, "source", { value: source });
  hint.dispatchEvent(event);
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
});
