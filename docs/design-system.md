# Design system

Tokens, primitives, component states and the voice of the interface text.
Values come from `docs/research/visual-direction.md`; token values live only
in `tokens/*.tokens.json`.

## Tokens

Three tiers. CSS uses the semantic tier only.

| Tier | File | Custom property | Used by |
| --- | --- | --- | --- |
| Base | `tokens/base.tokens.json` | `--base-*` | Semantic tokens only |
| Semantic | `tokens/semantic.tokens.json` | `--color-*`, `--space-*`, ... | All CSS |
| Theme | `tokens/themes/*.tokens.json` | Same names as semantic colors | Emitted as `light-dark()` |

### Semantic groups

| Group | Tokens | Use |
| --- | --- | --- |
| `color.bg` | `app`, `sidebar`, `raised`, `hover`, `active`, `selected`, `code`, `scrim` | Surfaces and their interaction states |
| `color.text` | `primary`, `secondary`, `tertiary`, `onAccent`, `link`, `danger`, `success`, `warning` | Text and icons |
| `color.border` | `subtle`, `default`, `strong`, `focus` | Hairlines, control borders, focus ring |
| `color.accent` | `default`, `hover`, `subtle` | Primary action, active item |
| `color.chip.<hue>` | `bg`, `text` for eight hues | Select options and callouts |
| `space.inline` | `xs`, `sm`, `md`, `lg` | Gaps along a row |
| `space.stack` | `xxs` to `xxl` | Gaps between stacked items |
| `space.inset` | `xs` to `xl`, `page` | Padding inside a container |
| `size` | `border`, `focus`, `icon`, `control`, `row`, `target`, `sidebar`, `content`, `menu`, `dialog` | Fixed measures |
| `radius` | `sm`, `md`, `full` | Controls, overlays, chips |
| `shadow` | `overlay`, `dialog` | Top layer only |
| `font` | `family`, `size`, `weight`, `lineHeight` | Type |
| `duration`, `easing` | `fast`, `medium`; `standard` | Motion |
| `layer` | `sticky`, `dragPreview` | The only z-order values |

Rules:

- Surfaces separate by `color.border.subtle` and a background step, never
  by a shadow.
- `color.text.tertiary` is for placeholders and metadata; it still meets
  4.5:1 on `color.bg.app`.
- `space.inline` for horizontal gaps, `space.stack` for vertical gaps,
  `space.inset` for padding. Do not mix them.

## Primitives

Shared primitives live in `src/ui/`, one folder each. Feature views compose
them; a feature never restyles one.

| Primitive | Element | Variants |
| --- | --- | --- |
| Button | `<button type="button">` | `primary`, `quiet` (default), `danger`; icon-only with an accessible name |
| Icon | Inline SVG, `aria-hidden="true"` | `sm`, `md` |
| Menu | `popover` with a list of buttons | Flat; items may have an icon and a shortcut hint |
| Dialog | `<dialog>` opened with `showModal()` | `default`, `wide` |
| Text field | `<input>` with a visible `<label>` | Single line |
| Chip | `<span>` | Eight hues |

### States

Every interactive primitive defines all of these. State is expressed with
attributes, never modifier classes.

| State | Selector | Treatment |
| --- | --- | --- |
| Rest | none | Transparent background for quiet controls |
| Hover | `:hover` | `color.bg.hover` |
| Pressed | `:active` | `color.bg.active` |
| Focus | `:focus-visible` | Ring: `size.focus.width` solid `color.border.focus`, offset `size.focus.offset`. Same on every control |
| Selected or current | `[aria-current]`, `[aria-selected="true"]`, `[aria-pressed="true"]` | `color.bg.selected` and `font.weight.medium` |
| Expanded | `[aria-expanded="true"]` | Chevron rotated; panel visible |
| Disabled | `:disabled`, `[aria-disabled="true"]` | `color.text.tertiary`, no hover, still focusable when the reason is explained |
| Busy | `[aria-busy="true"]` | Label unchanged; status text carries the progress |
| Invalid | `[aria-invalid="true"]` | `color.text.danger` border and a message linked with `aria-describedby` |

### Measures

- Control height: `size.control.md` in the reading area, `size.control.sm`
  in compact regions. Pointer targets are never below `size.target.min`.
- Rows in the sidebar, menus and the table: `size.row.height`, one line,
  truncated with an ellipsis; the full text is the element's accessible name.
- Reading column: capped at `size.content.max` and centered.

### Motion

| Element | Trigger | Animation | Duration | Easing |
| --- | --- | --- | --- | --- |
| Control background | Hover, press | Color change | `duration.fast` | `easing.standard` |
| Menu, dialog | Open, close | Opacity and a small rise | `duration.medium` | `easing.standard` |
| Page change | Navigation | Cross-fade through View Transitions | `duration.medium` | `easing.standard` |

All of it is removed under `prefers-reduced-motion: reduce`.

### Edge cases

- Long titles truncate in the sidebar, breadcrumbs and tabs; they wrap in
  the page title.
- An untitled page shows the placeholder text "Untitled" in
  `color.text.tertiary`; the stored title stays empty.
- Empty lists show one sentence and one action, with no illustration.
- Below 768 CSS px the layout is out of scope; the sidebar collapses and the
  content stays usable, but nothing is tuned for it.

## Interface text

All strings live in `src/ui/copy.ts`.

### Voice

Plain, calm and brief. The product is a quiet tool, so text states facts and
names actions. No exclamation marks, no "please", no "successfully", no
"oops".

### Rules

- Sentence case everywhere, including buttons and titles.
- Buttons and menu items start with a verb and name the object: "New page",
  "Move to trash", "Export workspace". Never "OK" or "Submit".
- One term per thing, used everywhere: page, block, database, property,
  row, view, trash, workspace.
- Errors say what happened, why if known, and what to do next, in that
  order.
- Confirmations name the action in the title and on the confirming button;
  the other button is "Cancel".
- Status text is a state, not a sentence: "Saving", "Saved", "Not saved".
- Shortcut hints use the platform's modifier name and are not part of the
  accessible name.

### Core strings

| Context | Text |
| --- | --- |
| Untitled page | Untitled |
| New page action | New page |
| Empty workspace | No pages yet. Create a page to start writing. |
| Save status | Saving / Saved / Not saved |
| Save failure detail | Changes could not be saved in this browser. Export the workspace to keep a copy. |
| Skipped records on load | {count} items could not be read and were skipped. |
| Trash confirmation title | Delete this page permanently? |
| Trash confirmation body | The page and everything inside it will be removed. This cannot be undone. |
| Trash confirmation buttons | Delete permanently / Cancel |
| Import failure | This file could not be imported. It is not a Pagecraft workspace file. |
| Newer file | This file was made by a newer version of Pagecraft. Update the app, then import it again. |
| Theme options | System / Light / Dark |
| Sidebar toggle | Hide sidebar / Show sidebar |
| Resize handle | Resize sidebar |
| Skip link | Skip to content |
