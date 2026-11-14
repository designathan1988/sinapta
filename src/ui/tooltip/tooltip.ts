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

// Focus given back to a control by code, as when its menu closes after a
// click on an entry, is neither a keyboard's nor the pointer's interest:
// no hint, as Notion shows none there.
const QUIET_FOCUS = ":focus:not(:focus-visible):not(:hover)";

// A control whose menu is open says nothing over it, as Notion's; an open
// toggle's arrow (data-disclosure) is no menu and still names what it does.
function isQuiet(source: Element): boolean {
  const isOpen =
    source.getAttribute("aria-expanded") === "true" &&
    !source.hasAttribute("data-disclosure");
  return isOpen || source.matches(QUIET_FOCUS);
}

// The hint repeats the control's name, so it adds nothing for assistive
// technology and carries no ARIA of its own.
export function installTooltip(): void {
  const onInterest = (event: Event): void => {
    const hint = event.target;
    const source = "source" in event ? event.source : null;
    if (!(hint instanceof HTMLElement) || hint.id !== TOOLTIP_ID) return;
    if (!(source instanceof Element)) return;
    // A control whose name is its own text asks for other words by
    // data-tooltip; a control with no words shows no empty hint.
    const words =
      source.getAttribute("data-tooltip") ??
      source.getAttribute("aria-label") ??
      "";
    if (words === "" || isQuiet(source)) {
      event.preventDefault();
      return;
    }
    hint.textContent = words;
  };
  // The event does not bubble out of the hint in every browser.
  document.addEventListener("interest", onInterest, true);
  // A press puts the hint away, as Notion's: the control is answering.
  document.addEventListener(
    "pointerdown",
    () => {
      const hint = document.getElementById(TOOLTIP_ID);
      if (hint?.matches(":popover-open") === true) hint.hidePopover();
    },
    true,
  );
}
