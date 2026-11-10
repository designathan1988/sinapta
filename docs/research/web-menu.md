# web-menu

## Guide
- id: `menu` ("Build a popup menu"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - focusgroup: Limited. Chrome 150, Edge 150. Unsupported in Firefox and Safari.
  - Popover: Baseline Newly available since 2025-01-27 (Chrome/Edge 116, Firefox 125, Safari 17).
  - Anchor positioning: guide states "Limited availability. Supported by: Safari 27 (Sep 2026). Unsupported in: Chrome, Edge, and Firefox" (looks like a data anomaly; treat as not safe, fallback mandatory).
  - `showPopover({ source })` implicit anchor: Newly available since 2026-01-13 (Chrome/Edge 137, Firefox 147, Safari 26).
  - Invoker commands (`command`/`commandfor`): Newly available since 2025-12-12 (Chrome/Edge 135, Firefox 144, Safari 26.2).
  - `:has()`: Widely available. `sign()`: Newly available since 2025-06-26.

## Rules we will follow
Page menu and property menus (have a trigger button):
```html
<button type="button" id="page-menu-trigger" aria-haspopup="menu" aria-expanded="false"
  commandfor="page-menu" command="toggle-popover">Page actions</button>
<div id="page-menu" popover="auto">          <!-- immediately after its trigger -->
  <div focusgroup="menu nomemory" aria-labelledby="page-menu-trigger">
    <button type="button">Rename</button>
    <button type="button" role="menuitemcheckbox" aria-checked="false">Favorite</button>
    <hr>
    <button type="button">Move to trash</button>
  </div>
</div>
```
Slash menu (no trigger): open from script with `menu.showPopover({ source: placeholder })`, where the
placeholder is an empty zero-size `position: fixed` element directly before the menu, moved to the
caret on each open; name the menu with `aria-label`.
```css
@supports (position-area: block-end) {
  [popover]:has(> [focusgroup~="menu"]) {
    position-area: block-end span-inline-end;
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
    inset: auto;
  }
}
@media (prefers-reduced-motion: no-preference) {
  [popover]:has(> [focusgroup~="menu"]) {
    opacity: 0; translate: 0 calc(-1 * var(--space-1));
    transition: opacity, translate, display, overlay;
    transition-duration: var(--duration-fast);
    transition-behavior: allow-discrete;
  }
  [popover]:has(> [focusgroup~="menu"]):popover-open {
    opacity: 1; translate: 0 0;
    @starting-style { opacity: 0; translate: 0 calc(-1 * var(--space-1)); }
  }
}
```
- No `role="menu"`/`role="menuitem"` in shared markup; no HTML `<menu>`; separators are `<hr>`.
- Set `aria-expanded` only in the `toggle` listener; move focus in `toggle`, never in `command`.
- Keyboard open enters the menu (first item); pointer open leaves focus on the trigger, no ring.
- Escape closes one level and restores focus to the trigger; Tab closes everything, no trap.
- Submenus (e.g. "Turn into"): `popover="auto"` nested after the trigger inside the parent focusgroup.
- Item rows: `display: flex; gap: var(--space-2)`, fixed leading icon slot, `.hint` with `margin-inline-start: auto`.

## Fallbacks required
- focusgroup: keep the attribute; if `!('focusGroup' in HTMLElement.prototype)`, add `role="menu"` to containers, `role="menuitem"` to `button:not([role])`, and a capture `keydown` handler for ArrowUp/ArrowDown/Home/End (wrap-around, skip disabled). Never install when native exists.
- Anchor positioning: gate anchored rules in `@supports (position-area: block-end)`; otherwise position from script in the `toggle` handler (below trigger / beside for submenu, flip and clamp), applied as `left`/`top` with `position: fixed; inset: auto; margin: 0` inside `@supports not (position-area: block-end)`.
- Invoker commands: detect `'commandForElement' in HTMLButtonElement.prototype`; on trigger `click` call `preventDefault()`, then close-and-restore or `menu.showPopover({ source: trigger })`.
- Popover: feature-detect `Object.hasOwn(HTMLElement.prototype, "popover")`, load `@oddbird/popover-polyfill` only if missing (not needed for our targets); style with `:is(:popover-open, .\:popover-open)`.
- `sign()`: `clamp()`-based safe-triangle variant under `@supports not (width: calc(sign(1px) * 1px))`.

## Verbatim quotes
- "Use a `<div focusgroup="menu nomemory">`, not the HTML `<menu>` element."
- "Do not use `popovertarget` or `popovertargetaction`; this pattern uses `commandfor` instead."
- "Without CSS Anchor Positioning, a popover falls back to the UA's centered viewport placement. Never ship that for a menu"
- "Do not add a second roving-tabindex system inside a focusgroup."
- "Move focus in the `toggle` event instead."
- "A submenu trigger never also runs a command: one control cannot both activate and open"

## Decision it supports
All menus go through one `src/ui/overlay/` menu helper: popover + `commandfor`, focusgroup with the scripted fallback, anchor positioning behind `@supports` with scripted placement. Open question: the slash menu filters while focus stays in the editor, which is closer to a combobox than this menu pattern.

## Sources
- modern-web-guidance id `menu`
- https://github.com/oddbird/popover-polyfill
- https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js
