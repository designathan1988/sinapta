// What happy-dom lacks of the platform the views use: the Popover API.
// Every test file runs this first; a file in Node has no HTMLElement and
// is left alone. A popover shows and hides, and `:popover-open` says
// which it is, as code that shows a popover once asks.
if (
  typeof HTMLElement !== "undefined" &&
  !("showPopover" in HTMLElement.prototype)
) {
  const open = new WeakSet<Element>();
  const native: unknown = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "matches",
  )?.value;
  Object.defineProperties(HTMLElement.prototype, {
    showPopover: {
      value(this: HTMLElement) {
        open.add(this);
      },
      configurable: true,
    },
    hidePopover: {
      value(this: HTMLElement) {
        open.delete(this);
      },
      configurable: true,
    },
  });
  Object.defineProperty(Element.prototype, "matches", {
    value(this: Element, selector: string): boolean {
      if (selector === ":popover-open") return open.has(this);
      return (
        typeof native === "function" &&
        Reflect.apply(native, this, [selector]) === true
      );
    },
    configurable: true,
  });
}
