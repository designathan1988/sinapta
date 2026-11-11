// What happy-dom lacks of the platform the views use: the Popover API.
// Every test file runs this first; a file in Node has no HTMLElement and
// is left alone. A popover only needs to show for the tests that use it.
if (
  typeof HTMLElement !== "undefined" &&
  !("showPopover" in HTMLElement.prototype)
) {
  Object.defineProperties(HTMLElement.prototype, {
    showPopover: { value: () => undefined, configurable: true },
    hidePopover: { value: () => undefined, configurable: true },
  });
}
