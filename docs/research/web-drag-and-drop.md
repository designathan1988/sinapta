# web-drag-and-drop

## Guide
- id: `drag-and-drop` ("Rearrange Items with Drag and Drop"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - `moveBefore()`: Limited. Chrome/Edge 133, Firefox 144. Unsupported in Safari.
  - `reading-flow`: Limited. Chrome/Edge 137. Unsupported in Firefox and Safari.
  - `user-select`: Limited (Safari needs the `-webkit-` prefix).
- Scope limit: one axis at a time; "it does not cover reordering a grid or wrapped layout, or moving items between lists." Sidebar re-parenting (drop into another page) is outside the guide.

## Rules we will follow
Same pointer-event engine for block reorder (vertical), sidebar siblings (vertical) and table column
headers (horizontal). No HTML5 `draggable`, no clones.
```html
<div class="blocks-item">
  <button type="button" class="blocks-handle" aria-pressed="false"
    aria-label="Reorder block: Heading “Roadmap”"></button>
  <div contenteditable="true">…</div>
</div>
```
```css
.blocks-handle {
  cursor: grab; touch-action: none;
  -webkit-user-select: none; user-select: none;
}
:root.is-dragging, :root.is-dragging * { cursor: grabbing; }
.blocks-item:has(.blocks-handle:focus-visible) {
  outline: var(--size-focus-ring) solid var(--color-focus-ring);
  outline-offset: var(--space-1);
}
.blocks-item.is-lifted {
  position: relative; z-index: var(--layer-drag); pointer-events: none;
  scale: var(--scale-lifted); box-shadow: var(--shadow-lifted);
}
.blocks-list[data-drop]::after {            /* drop marker line, no element appended */
  content: ""; position: fixed; pointer-events: none;
  inset-block-start: var(--drop-y); inset-inline-start: var(--drop-x);
  inline-size: var(--drop-w); block-size: var(--size-drop-line);
  background: var(--color-drop-marker);
  @media (forced-colors: active) { background: Highlight; }
}
```
- Dedicated handle; `touch-action: none` on the handle only. Primary button only; one `pointerId`.
- `handle.setPointerCapture(event.pointerId)` on `pointerdown`; clean up on `lostpointercapture`.
- Destination from layout midpoints (`offsetTop + offsetHeight / 2`, or `offsetLeft + offsetWidth / 2` for columns), not `event.target` / `elementFromPoint`.
- No live reordering during the move: show a marker, skip no-op drops, dispatch one `block.move` / `page.move` / `view.moveColumn` command on `pointerup`.
- Escape cancels and is announced. Autoscroll with a `requestAnimationFrame` loop near container edges.
- Keyboard: grab–move–drop on the handle (Space/Enter pick up, arrows along the axis, Space/Enter drop, Escape cancel), `aria-pressed` toggled, plus "Move up/down" in the block and page menus.
- Announce item and new position in the single polite live region; only when the position changed.
- After a move: `item.scrollIntoView({ block: 'nearest', inline: 'nearest' })`, then `focus({ preventScroll: true })` on the handle.
- FLIP-animate moves; skip under `prefers-reduced-motion: reduce`. No `transform`/`filter`/`contain` on the list or its ancestors while the fixed marker is used.

## Fallbacks required
- `moveBefore()` (Safari): detect `'moveBefore' in Element.prototype`; else `referenceNode.before(item)` or `container.append(item)`. Then (a) keep `pointermove`/`pointerup`/`pointercancel` listeners on `document` and re-call `setPointerCapture` when `hasPointerCapture()` is false; (b) explicitly `.focus()` the handle after the move and delay the live-region update about 500 ms (debounced, clearing the previous message first).
- `reading-flow`: do not rely on it; order each item's DOM so tab order is already logical (handle, then content).
- `user-select`: write `-webkit-user-select: none` before `user-select: none`.

## Verbatim quotes
- "Reorder the real children in the DOM (not via CSS `order` or `flex-direction: *-reverse`) so visual, keyboard, and reading order stay aligned."
- "**Find the destination from layout, not `event.target`.** Pointer capture redirects `pointermove` `event.target` to the capturing handle."
- "Don't reorder while the pointer moves: shifting siblings feel jittery. Keep the source item in its slot and show a drop marker."
- "**Lift the real item; don't clone it.**"
- "Don't use CSS anchor positioning (it drifts while autoscrolling), and keep `transform`, `filter` and `contain` off the list and its ancestors."
- "If the order represents user-controlled data or directly affects behavior—for example, task priority, playlist order, or workflow sequence—treat reordering as essential and provide the required pointer and keyboard interactions"

## Decision it supports
One pointer-capture drag controller in `src/ui/` (owning the rAF loop and transient drag state, outside the views) serves blocks, sidebar and columns, commits a single command on release, and always has a keyboard path. With lit-html the store re-render performs the DOM move, so list templates must be keyed to move the existing node.

## Sources
- modern-web-guidance id `drag-and-drop`
- Related id named by the guide: `drag`
