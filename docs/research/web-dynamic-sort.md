# web-dynamic-sort

## Guide
- id: `dynamic-sort` ("Handling dynamic user-triggered changes to sort order"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - View transitions (document-level): Baseline Newly available since 2025-10-14 (Chrome/Edge 111, Firefox 144, Safari 18).
  - Element-scoped view transitions (`element.startViewTransition()`): Limited. Chrome/Edge 147. Unsupported in Firefox and Safari.
  - `moveBefore()`: Limited. Chrome/Edge 133, Firefox 144. Unsupported in Safari.
- Scope: applying a new order to the DOM (move, animate, announce, performance), not computing it.

## Rules we will follow
Table rows when a `view.setSort` command changes the row order from `@tanstack/table-core`:
```ts
// rows template: keyed by row id so lit-html moves the existing <tr>, never rebuilds <tbody>
html`<tbody>${repeat(rows, (row) => row.id, rowView)}</tbody>`
```
```ts
function applyWithTransition(table: HTMLTableElement, update: () => void, rowCount: number) {
  if (rowCount > TRANSITION_ROW_LIMIT) return update();          // a few hundred
  if ('startViewTransition' in table) table.startViewTransition(update);
  else if (document.startViewTransition) document.startViewTransition(update);
  else update();
}
```
```css
.database-row { view-transition-name: match-element; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}
.database-row { content-visibility: auto; contain-intrinsic-block-size: auto var(--size-row); }
```
```html
<p id="announcer-polite" role="status" class="visually-hidden"></p>
```
- `<thead>` is never reordered; `<tbody>` is never recreated.
- No CSS `order` / `row-reverse` to fake order.
- One announcement per sort, naming the result: "Sorted by Due date, ascending, 240 rows". No `aria-live` on the table.
- Focus stays on the header button that triggered the sort; current order readable from it (`aria-sort` on the `<th>`).
- Reorder in one pass with no layout reads (`offsetTop`, `getBoundingClientRect()`) in the loop.
- Skip the transition above a few hundred rows; the final DOM state is always applied in the update callback.

## Fallbacks required
- Element-scoped view transitions (Chrome/Edge only): "use `document.startViewTransition()`. If it does not support that either, reorder without animation." Graceful degradation.
- `moveBefore()` (Safari): "use `append()`. DOM order is identical; items may lose focus, iframe, or animation state inside them". lit-html's keyed `repeat` moves nodes with `insertBefore`, which is equivalent to this `append()` fallback path in every browser.
- View transitions overall are an enhancement: the sort must be correct with none.

## Verbatim quotes
- "**MANDATORY:** Reorder the existing DOM nodes into the new order. Do not recreate them."
- "Never reorder header rows in `<thead>` or recreate the `<tbody>`."
- "**DO NOT** put `aria-live` on the list, which would announce every moved item."
- "Skip the transition when the list is larger than a few hundred items."
- "Above roughly a thousand items, virtualize the list instead of keeping every node in the DOM. Skip the view transition when virtualizing."
- "Layout and rendering are the cost, not computing the order."

## Decision it supports
Row templates must be keyed so a sort moves existing `<tr>` nodes, with one polite status message and an optional, size-capped view transition. Two spec tensions for ADRs: section 3 limits lit-html to "`html` and `render` only" (keyed moves need the bundled `repeat` directive), and section 5.5 prefers `content-visibility` up to 5,000 rows while the guide says to virtualize above roughly a thousand.

## Sources
- modern-web-guidance id `dynamic-sort`
- Related id named by the guide: `scoped-component-transitions`
