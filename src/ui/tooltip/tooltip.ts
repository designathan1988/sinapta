// Tooltips for controls that show only an icon. The page has one hint
// popover, in index.html; a control points at it with `interestfor`, and
// the hint takes the control's accessible name when interest is shown.
// Browsers without interest invokers get the native `title` instead.
import "./tooltip.css";
import { nothing } from "lit-html";

const TOOLTIP_ID = "tooltip";

const HAS_INTEREST =
  typeof HTMLButtonElement !== "undefined" &&
  "interestForElement" in HTMLButtonElement.prototype;

// The value of a control's `interestfor` attribute.
export const TOOLTIP_TARGET = HAS_INTEREST ? TOOLTIP_ID : nothing;

// The value of a control's `title` attribute.
export function tooltipTitle(label: string): string | typeof nothing {
  return HAS_INTEREST ? nothing : label;
}

// The hint repeats the control's name, so it adds nothing for assistive
// technology and carries no ARIA of its own.
export function installTooltip(): void {
  const onInterest = (event: Event): void => {
    const hint = event.target;
    const source = "source" in event ? event.source : null;
    if (!(hint instanceof HTMLElement) || hint.id !== TOOLTIP_ID) return;
    if (!(source instanceof Element)) return;
    hint.textContent = source.getAttribute("aria-label") ?? "";
  };
  // The event does not bubble out of the hint in every browser.
  document.addEventListener("interest", onInterest, true);
}
