# web-html

## Guide
- id: `html` ("HTML"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support: this guide prints no Baseline blocks. Features it uses and their status in sibling guides: `<dialog>` Widely available (since 2022-03-14); Popover Newly available (since 2025-01-27); `closedby` Limited (no Safari); `inert`, `<search>`, `<details name>` and `::details-content` carry no figures here, so confirm before relying on the last two.

## Rules we will follow
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Roadmap | Pagecraft</title>            <!-- updated on every page change -->
</head>
<body>
  <div class="app-shell">
    <nav class="sidebar" aria-label="Pages">
      <search><button type="button">Search</button></search>
      <ul role="tree" aria-label="Workspace">…</ul>
    </nav>
    <main>
      <header class="topbar">…breadcrumbs, save status, page menu…</header>
      <h1 contenteditable="true">Roadmap</h1>
      <div class="blocks-list">…</div>
    </main>
  </div>
</body>
</html>
```
- One `<h1>` per view (the page title). Heading blocks render as `<h2>`–`<h4>` so levels never skip. A modal dialog may have its own `<h1>`, but we use one consistent level for dialog titles.
- `<button type="button">` for every action; `<a href>` only for real URLs (page links, external links).
- Block elements map to semantics: list blocks to `<ul>`/`<ol>`, quote to `<blockquote>`, code to `<pre><code>` (with `tabindex="0"`, `role="region"` and a name when scrollable), divider to `<hr>`, toggle to `<details><summary>` (no interactive elements inside `<summary>`).
- Database view is a real `<table>` (spec 5.5).
- Decorative SVG icons get `aria-hidden="true"`; icon-only buttons get an accessible name.
- No `title` attribute tooltips; no positive `tabindex`; no inline event handlers (lit-html `@event` bindings compile to `addEventListener`, which also satisfies the CSP).
- Inline `style` only to pass custom properties (`style="--sidebar-depth: 2"`), never static design values.
- State is never conveyed by colour alone (save status has text, selected rows have `aria-selected`/`aria-current`).
- When a focused element is removed (block deleted, row trashed), move focus to a logical neighbour.
- Overlays: `<dialog>` + `showModal()` for interruptions, `popover` for menus, `<details>` for inline expansion.

## Fallbacks required
- The guide has no fallback section; it defers to `declarative-dialog-popover-control` for cross-browser Popover use. Concrete fallbacks are in `web-dialog.md` (`closedby`) and `web-menu.md` (popover, invokers).
- `closedby="any"` (recommended here for light dismiss) is Limited: Safari needs the click-outside script from `web-dialog.md`.
- `<details name>` exclusive accordions and `::details-content`: not needed in version 1; if used, treat as progressive enhancement.

## Verbatim quotes
- "**DO** use a single `<h1>` per page/view representing the main topic. Exceptions can be made for modal dialogs, which can also use a single `<h1>`."
- "**DON'T** change the native semantics of elements with ARIA unless it is a critical requirement."
- "**DON'T** use the `title` attribute to create tooltip effects, as these cannot be accessed using a keyboard."
- "**DON'T** use inline event handlers (e.g., `onclick`). Trigger actions using `addEventListener()`."
- "**DO** use the `style` attribute to pass state to CSS via **Custom Properties**."
- "**Heuristic Rule**: Use `<dialog>` for interruptions requiring user action, `popover` for transient info, and `<details>` for inline content expansion."

## Decision it supports
The shell uses landmarks (`<nav>`, `<main>`, `<header>`, `<search>`) and each block type's view returns the matching semantic element, with ARIA added only where HTML has no element (the sidebar tree). One tension to record: the spec's arrow-key cell navigation on a native `<table>` needs composite `grid` semantics, which this guide says to avoid "unless it is a critical requirement".

## Sources
- modern-web-guidance id `html`
- https://html.spec.whatwg.org/ (cited in the guide's example)
- Related ids named by the guide: `declarative-dialog-popover-control`, `forms`
