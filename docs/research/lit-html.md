# lit-html

## Version checked

`lit-html@3.3.3` (2026-11-10). Types and source read from the published package
(`development/lit-html.{d.ts,js}`, `development/directives/*`). Only dependency:
`@types/trusted-types` (types only).

## API we will use

```ts
import { html, render, nothing, noChange, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";       // child position only
import { keyed } from "lit-html/directives/keyed.js";
import { live } from "lit-html/directives/live.js";           // attribute/property only
import { ref, createRef } from "lit-html/directives/ref.js";  // element position
import { classMap } from "lit-html/directives/class-map.js";  // sole expr in class=""
import { ifDefined } from "lit-html/directives/if-defined.js";
```

- `html(strings, ...values): TemplateResult<1>`
- `render(value: unknown, container: HTMLElement | SVGElement | DocumentFragment,
  options?: { host?; renderBefore?; creationScope?; isConnected? }): RootPart`.
  Calling it again on the same container diffs values only. Options must not change.
- `repeat(items, keyFn: (item, i) => unknown, template: (item, i) => unknown)`: keyed,
  moves DOM (keeps focus and caret of a moved block). Without keys use plain `.map()`.
- `ref((el: Element | undefined) => void)`: called with `undefined` on removal/move.
- `ifDefined(v)` removes the attribute for `null`/`undefined`; `nothing` renders nothing.
- Bindings: `attr=${}`, `?bool=${}`, `.prop=${}`, `@event=${fn | { handleEvent, capture?, once?, passive? }}`.

```ts
const blockList = (blocks: readonly Block[], dispatch: Dispatch) => html`
  <div class="editor-list" @beforeinput=${(e: InputEvent) => onBeforeInput(e, dispatch)}>
    ${repeat(blocks, (b) => b.id, (b) => html`
      <div contenteditable="true" data-block-id=${b.id}>${b.text}</div>`)}
  </div>`;
```

## Pitfalls

- **Dirty check is against the last committed value, not the DOM.** A child text
  binding is skipped when `value === committedValue`; otherwise lit sets
  `textNode.data = value` on the existing text node (`_commitText`). So a re-render
  with unchanged text never touches a focused `contenteditable`; a changed text
  rewrites the node and the DOM range collapses to offset 0. The caret must be
  restored after every render that changes the focused block (spec 5.3 already says so).
- **`live` does not help for child text.** It throws unless used in an attribute,
  property or boolean-attribute binding. It is useful for `.value=${live(x)}` on cell
  editors and would work as `.textContent=${live(text)}` for plain-text blocks only.
- **IME / any uncancelled edit desynchronises lit.** After `compositionend` the DOM
  differs from lit's committed value, and the browser may have split or replaced
  the text node or removed lit's comment markers (dev build throws "This ChildPart
  has no parentNode"). Force a clean re-projection of that block after
  `compositionend`, e.g. `keyed(block.compositionRevision, html`...`)`.
- lit puts comment marker nodes inside the editable element; caret offset mapping
  must walk text nodes only, and empty text renders no text node at all.
- `repeat` duplicate keys are undefined behaviour; keys must be block ids.
- `@event`: lit registers itself once per binding (`addEventListener(name, part)`)
  and only swaps the stored handler on re-render, so fresh closures per render are
  cheap. It re-adds only if `capture/once/passive` change. Delegation is manual: one
  `@event` on the list container plus `event.target.closest("[data-block-id]")`;
  works only for bubbling events (`beforeinput`, `input`, `click`, `keydown` bubble;
  `focus`/`blur` do not, use `focusin`/`focusout`).
- Plain-function handlers get `this = options.host` (undefined for us).
- CSP: no `eval`/`new Function`; templates are parsed via `template.innerHTML` of
  static strings; listeners use `addEventListener`. Works with `script-src 'self'`.
  With Trusted Types enabled allow policy name `lit-html`. Inline `style="..."`
  attributes need `style-src 'unsafe-inline'`; avoid them (use classes; `styleMap`
  uses CSSOM and is fine). The `development` export condition logs a dev-mode
  warning; Vite production builds pick the minified default.

## Decision it supports

Rendering ADR (0001): default stands (one root render, `repeat` keyed by block id).
Note the spec row "`lit-html`, `html` and `render` only" must be read as "no
component classes": `repeat` (and `keyed`, `ref`, `classMap`, `ifDefined`, `live`)
are needed and ship in the same package.

## Sources

- https://lit.dev/docs/libraries/standalone-templates/
- https://lit.dev/docs/templates/directives/
- https://lit.dev/docs/components/events/
- `node_modules/lit-html/development/lit-html.js` (`_$setValue`, `_commitText`, `EventPart`), `directives/live.js`
