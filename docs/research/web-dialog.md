# web-dialog

## Guide
- id: `dialog` ("Dialog"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - `<dialog>` itself: Widely available since 2022-03-14 (stated in `css-layout`).
  - `closedby`: Limited. Chrome/Edge 134, Firefox 141. Unsupported in Safari.
  - `overscroll-behavior` (on non-scrollable containers): Limited. Chrome/Edge 144, Firefox 150. Unsupported in Safari.
  - Invoker commands: Newly available since 2025-12-12 (Chrome/Edge 135, Firefox 144, Safari 26.2).
  - Popover (Rules 2 and 3 only): Newly available since 2025-01-27.

## Rules we will follow
Rule 1 (blocking modal) for confirm, settings, import and command palette:
```html
<!-- Confirm (destructive): safe action gets autofocus -->
<dialog id="confirm-trash" aria-labelledby="confirm-trash-title">
  <h2 id="confirm-trash-title">Delete this page permanently?</h2>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
<!-- Settings and command palette: light dismiss allowed -->
<dialog id="command-palette" closedby="any" aria-label="Command palette">…</dialog>
```
```css
dialog:modal { overscroll-behavior: contain; }
dialog::backdrop { overflow: hidden; overscroll-behavior: contain; background: var(--color-overlay-scrim); }
dialog[open] { display: grid; gap: var(--space-4); padding: var(--space-5); }
```
```ts
dialog.showModal();                       // never show() or the open attribute
dialog.addEventListener('close', () => {
  const choice = dialog.returnValue;       // '' means dismissed without choosing
  dialog.returnValue = '';
  dispatch(choice === 'delete' ? confirmCommand : closeOverlayCommand);
});
```
- No `role="dialog"`, `aria-modal`, focus trap, `inert` toggling, Esc handler or focus-return code.
- No scroll lock via `overflow: hidden` / `position: fixed` on `html` or `body`.
- Every dialog is named: `aria-labelledby` its heading, or `aria-label` when there is no visible title.
- `display` only under `dialog[open]`, never on bare `dialog`.
- Dirty forms (settings, import): guard in a `cancel` handler plus `closedby="none"`; explain why it stayed open via `aria-describedby`; do not move controls under the pointer.
- Menus are not dialogs (Rule 3): slash, page and property menus use `popover`, see `web-menu.md`.
- Command palette input: Enter handler must be IME-safe (see `web-extras.md`).

## Fallbacks required
- `closedby` (Safari): Esc still closes; only click-outside is lost. For `closedby="any"` dialogs add, when `!('closedBy' in HTMLDialogElement.prototype)`, `pointerdown`/`pointerup` listeners that compare pointer position with `getBoundingClientRect()` and call `dialog.close()` only if both press and release were outside. Keep unsaved-changes guards in `cancel`, not in `closedby="none"` alone.
- `overscroll-behavior`: progressive enhancement; do not feature-detect; do not fall back to `overflow: hidden` on `html`/`body`.
- Invoker commands: keep `command="show-modal"` markup and load `invokers-polyfill` only when `!('commandForElement' in HTMLButtonElement.prototype)`. Since the store opens our dialogs, we call `showModal()` from the overlay module and need no polyfill.
- Popover polyfill: conditional on `!Object.hasOwn(HTMLElement.prototype, "popover")`; not needed for our targets.

## Verbatim quotes
- "**DON'T** add `role="dialog"`, `aria-modal`, a focus trap, `inert` toggling or an `Esc` handler."
- "**DON'T** open it with `show()` or the `open` attribute."
- "**DO** put `autofocus` on the safe action (such as Cancel or Keep) in a destructive confirmation."
- "**DON'T** write code to return focus on close. The browser returns it to the invoker."
- "**DON'T** set `display` on `dialog` unconditionally. It overrides the closed state. Scope it with `dialog[open]`."
- "Keep the unsaved-changes guard in a `cancel` handler, not in `closedby="none"` alone, so it also protects where `closedby` is missing."

## Decision it supports
Settings, confirm and the command palette are native `<dialog>` elements opened with `showModal()` by the single overlay owner, which maps the `ui` slice to `showModal()`/`close()` and maps `close`/`cancel` events back to commands. The guide lists "palettes" under Rule 2 (non-modal `<dialog popover>`); we treat the command palette as modal because it interrupts, which needs an ADR line.

## Sources
- modern-web-guidance id `dialog`
- https://github.com/oddbird/popover-polyfill
- npm `invokers-polyfill`
- Related ids named by the guide: `declarative-dialog-popover-control`, `prevent-page-scroll-under-modal-dialog`, `animate-to-from-top-layer`, `drag`, `persistent-top-layer-ui`
