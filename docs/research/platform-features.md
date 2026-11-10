# Research: platform feature status

Checked 2026-11-10 against MDN browser-compat-data 8.1.8 (2026-11-02), webstatus.dev and Modern Web Guidance.
Target window ("latest two versions"): Chrome 155-156, Edge 155-156, Firefox 158-159, Safari 27.1-27.2.
"OK" = present in the whole window. Versions are first-support versions (Chrome = Edge unless noted).

## Findings

| Feature | Chrome | Firefox | Safari | Status | Fallback | Usage rule |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API (`popover`, `popovertarget`, `:popover-open`) | 114 | 125 | 17 | OK, Baseline newly (2025-01-27) | none | Menus and palettes are `popover="auto"`; open state comes from the `ui` slice, sync it in `beforetoggle`/`toggle` handlers. |
| `popover="hint"` | 151 | 153 | preview only | NOT OK (Safari) | Probe `el.popover = "hint"`; if it reads back `"manual"`, switch to `auto`/manual close logic | Tooltips only; never required for function. |
| CSS anchor positioning (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`, `anchor()`) | 125 (`position-area` 129, `-fallbacks` 128) | 147 | 26 | Core OK. Web-features still says "limited" because of sub-features (`position-visibility` values, anchored container queries) | Guidance option 2: put all anchor rules inside `@supports (position-area: block-end)`; outside it the popover stays UA-centered. No polyfill (dependency limit) | Always set `anchor-name` and `position-anchor` explicitly: the initial value of `position-anchor` changed across Chrome 127-151, Firefox 147-151 and Safari 26-27. |
| `<dialog>` + `showModal()` | 37 | 98 | 15.4 | OK, widely | none | Every modal is `<dialog>` opened with `showModal()`. |
| `<dialog closedby>` | 134 | 141 | preview only | NOT OK (Safari) | If `!("closedBy" in HTMLDialogElement.prototype)`: backdrop click handler that compares the click point with the dialog rect, then `close()` | `closedby="any"` plus the fallback; listen to `cancel`/`close`, not click. |
| View Transitions, same-document (`document.startViewTransition`) | 111 | 144 | 18 | OK, newly (2025-10-14) | `if (!document.startViewTransition) update()` | Page changes only; skip when `prefers-reduced-motion`. The callback must contain the synchronous store-driven render. |
| `content-visibility: auto` | 85 | 125 | 26 | OK, newly (2025-09-15) | ignored when unsupported | Block list rows; always pair with `contain-intrinsic-size`. Not usable on `<tr>` (see Pitfalls). |
| `contain-intrinsic-size` (`auto <length>`) | 83 | 107 | 17 | OK, widely | none | `contain-intrinsic-block-size: auto <token>` so measured sizes are remembered. |
| `light-dark()` + `color-scheme` | 123 / 81 | 120 / 96 | 17.5 / 13 | OK | none | `color-scheme: light dark` on `:root`; `[data-theme]` sets `color-scheme: light` or `dark`; theme tokens use `light-dark()`. |
| CSS nesting | 120 | 117 | 17.2 | OK, widely | none | Nest at most 3 levels; use `&` explicitly. |
| `@layer` | 99 | 97 | 15.4 | OK, widely | none | One order statement, first rule of `index.css`. |
| Container queries (size) | 105 | 110 | 16 | OK, widely | none | Components query a named container, never the viewport. Scroll-state and anchored queries are Chrome-only: do not use. |
| `@scope` | 118 | 146 | 26.4 | OK, newly (2026-03-24) | not needed (folder-prefixed class names already scope) | Optional; do not mix with the prefix convention without an ADR. |
| `field-sizing: content` | 123 | 152 | 26.2 | OK, newly (2026-06-16) | fixed `rows`/min size | Auto-growing title and cell editors. |
| `Document.ariaNotify()` | 141 | 150 | 27 | OK but new; VoiceOver may drop an announcement that races another event | live region | Use the live region as the baseline; `ariaNotify` only as an enhancement. |
| `Element.moveBefore()` | 133 | 144 | no | NOT OK (Safari) | `before()`/`insertBefore`, then restore focus and pointer capture | Do not depend on state-preserving moves. |

Patterns (not features):

- **Drag for trees and lists.** Modern Web Guidance (`drag-and-drop`) prescribes pointer events: `setPointerCapture` on a handle, destination from layout midpoints, a drop marker instead of live shifting, Escape cancels, move once on release. HTML Drag and Drop has no keyboard or screen-reader model and little control over the drag image and autoscroll; keep it only for dropping external data (not needed in version 1).
- **WCAG 2.2 SC 2.5.7 Dragging Movements (AA):** "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging". A keyboard shortcut alone "does not automatically meet this success criterion"; a click/tap path is required (for example a row menu with Move up / Move down / Move to). SC 2.1.1 separately requires the keyboard path. Both are needed for the sidebar tree, block reorder, and column reorder/resize.
- **ARIA tree (APG).** `role="tree"` with a label, `treeitem` nodes, children in `role="group"`, `aria-expanded` only on parents, one item `tabindex="0"` and the rest `-1` (roving). Keys: Up/Down move, Right opens or enters, Left closes or goes to parent, Home/End, Enter activates, type-ahead recommended. Use `aria-current="page"` for the open page (navigation tree); the APG selection text only covers `aria-selected`/`aria-checked`.
- **Sortable table (APG).** `<button>` inside `<th scope="col">`; `aria-sort="ascending|descending"` on the `<th>` of the sorted column only, removed from the others; icons `aria-hidden`; sorting described once in the `<caption>`.
- **Editable table = APG grid.** Arrow-key cell navigation needs `role="grid"` on the `<table>` (row and cell roles stay implicit). Arrows move by cell, Home/End and Ctrl+Home/End, Enter or F2 enters edit mode, Escape leaves it, Tab while editing moves to the next cell. One cell is tabbable at a time. With windowed rows add `aria-rowcount` and `aria-rowindex`.
- **Live regions.** Put one empty `role="status"` (plus `aria-live="polite"`) element in `index.html` so it exists before any update; clear then set text for repeats; delay about 500 ms after a focus move so the focus announcement does not swallow it. Never put `aria-live` on the table or tree.

## Pitfalls

- `content-visibility: auto` needs size containment, and CSS Containment says size containment has no effect "if its principal box is an internal table box" (layout and paint containment likewise, except for cells). On `<tr>`/`<tbody>` it does nothing. For the 5,000-row table the real options are windowing rows (keep `<table>`, add `aria-rowcount`) or changing `display` on rows, which risks table semantics.
- Popover light dismiss closes the popover without telling the store: always handle `toggle` and dispatch, or the `ui` slice says "open" while nothing is shown.
- `inset: auto; margin: 0` on a `[popover]` outside `@supports` strands it at 0,0 where anchoring is unsupported.
- View transitions snapshot the old state before the callback: a caret restore inside the callback can be lost; do not wrap keystroke renders in a transition.
- Unprefixed `user-select` is still missing in Safari: write `-webkit-user-select` first.
- lit re-renders reorder DOM with `insertBefore`; a dragged row loses pointer capture and focus unless both are restored after render.

## Decision it supports

Browser-support ADR: the default window stands. Only three items need a fallback today: `popover="hint"`, `<dialog closedby>` and `moveBefore()` (all Safari). Anchor positioning is used natively with the guidance's `@supports` gate and no polyfill. The data-table ADR must plan row windowing from the start, because `content-visibility` cannot apply to table rows. Reordering uses pointer events plus a menu path and a keyboard path.

## Sources

- MDN browser-compat-data 8.1.8: https://github.com/mdn/browser-compat-data ; Baseline data: https://webstatus.dev/
- Modern Web Guidance (guides: viewport-aware-dropdowns, light-dismiss-a-dialog, same-document-transitions, defer-rendering-heavy-content, drag-and-drop, sortable-table, interest-triggered-tooltips): https://github.com/GoogleChrome/modern-web-guidance
- CSS Containment 2 (no-effect cases, content-visibility): https://drafts.csswg.org/css-contain-2/
- WCAG 2.2 Understanding 2.5.7: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- APG Tree View: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- APG Sortable Table: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
- APG Grid: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- MDN ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
