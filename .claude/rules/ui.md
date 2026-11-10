---
paths:
  - "src/{ui,features,blocks}/**/*.ts"
---

# Interface rules

- A view file exports one function, `renderX(slice, dispatch)`, returning a
  lit-html `TemplateResult`. No classes, no module-level variables, no
  timers, no subscriptions.
- Views read state only through selectors of their own feature or of
  `src/state/`. They never read the DOM to decide what to render.
- DOM events become commands inside the view file and nowhere else. Global
  keys are registered in `src/ui/shortcuts/shortcut-registry.ts`.
- Use event delegation on list containers: one listener on the container,
  the target found with `closest("[data-block-id]")`.
- Platform first: `<dialog>` for modals, `popover` for menus, `<details>`
  for disclosure, `<table>` for the data table, `<button>` for actions.
- Overlays open only through `src/ui/overlay/`; the `ui` slice holds at most
  one open overlay.
- Text blocks: one `contenteditable` per block. Handle `beforeinput`, cancel
  it, dispatch a command, restore the caret from `ui.selection`. During IME
  composition let the browser edit and read back at `compositionend`.
- Never insert pasted HTML. Never set `innerHTML`. Never use `unsafeHTML`.
- Link `href` values pass through `src/model/link-href.ts`.
- Every string the user sees comes from `src/ui/copy.ts`.
- Every interactive element is reachable by keyboard and has a visible
  focus ring; every drag action has a keyboard equivalent.
- Other folders are imported through their `index.ts` only.
