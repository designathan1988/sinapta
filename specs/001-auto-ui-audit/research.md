# Research: Automatic interface audit

Each unknown from the plan's Technical Context, settled.

## R1. Finding every control without a per-screen list

- **Decision**: An in-page discovery script lists every shown element that a person can use: `button`, `a[href]`, `input`, `select`, `textarea`, `[contenteditable="true"]`, `[role]` in {button, link, tab, menuitem, menuitemradio, menuitemcheckbox, option, checkbox, switch, treeitem, gridcell, row}, `[tabindex]` ≥ 0, and any element whose computed `cursor` is `pointer` that has none of those (a clickable `div` is a finding in itself: "pressable but not a control"). Elements that only appear on hover are found by first pointing at every row-like container (`[role="treeitem"]`, `[role="row"]`, `tr`, `[data-block-id]`, `[data-row-id]`, list items with controls) and listing again.
- **Rationale**: The DOM plus roles is the same contract the project already keeps for accessibility (ui.md: every control is a `<button>` or has a role), so discovery needs no knowledge of screens. Playwright 1.64's accessibility snapshot API is gone (replaced by `ariaSnapshot()`, which returns YAML without element handles), so the DOM is the practical source.
- **Alternatives**: `locator.ariaSnapshot()` (no handles to act on); CDP `Accessibility.getFullAXTree` (heavier, maps back to nodes awkwardly); per-screen selectors (the thing the owner wants gone).

## R2. Grouping identical controls ("kinds")

- **Decision**: A control's kind is its tag, role, the first two class names, whether it holds an icon, text or both, and its `aria-haspopup`; labels count only as "has a label" (digits and names vary per row). Each kind is exercised once per theme (the first instance met), every instance is still checked for drawing.
- **Rationale**: Twenty table rows share one hover rule; exercising one is as good as twenty and keeps the sweep within budget. Drawing checks are cheap and run on all.
- **Alternatives**: Exercise every instance (minutes, not seconds); sample randomly (non-deterministic reports).

## R3. "Pointing visibly changes the control" without image diffs

- **Decision**: Before and after moving the real mouse onto the control (`page.mouse.move` to its center, no actionability waits), read a style signature of the control, its descendants and their `::before`/`::after`: background color and image, color, border colors, box-shadow, outline, opacity, text-decoration, transform, filter, visibility. Unchanged signature and no newly shown descendant → "no visible response to pointing". Every shown element's box in the same place is recorded before and after: an element in normal flow (not absolute or fixed, not inside the control) that moved by ≥ 0.5 px → "pointing moves the layout".
- **Rationale**: Computed styles give the exact property that changed and cost about a millisecond; real mouse movement keeps ancestor `:hover` rules (a row revealing its handles) faithful. No PNG decoding, no dependency.
- **Alternatives**: Pixel diff of element screenshots (needs a PNG decoder, slower, noisy with antialiasing and caret blink); CDP `CSS.forcePseudoState` (forces `:hover` on one node only, so ancestor hover rules never fire).

## R4. Visible focus

- **Decision**: Press `Shift` once so the page is in keyboard modality, then call `element.focus()`; Chrome then matches `:focus-visible`. Compare the same signature (outline, box-shadow, border, background) before and after; no change → "focus not visible". Only elements in the tab order are checked.
- **Rationale**: Matches what a keyboard user sees; one evaluate per control.
- **Alternatives**: `focus({ focusVisible: true })` (not supported by Chrome for all elements); pressing Tab through the page (order-dependent and slow).

## R5. Which controls are safe to press

- **Decision**: Press only controls that declare they open something: `aria-haspopup`, `aria-expanded`, `role="tab"`, `[popovertarget]`, `[interestfor]` is ignored (tooltips judged on hover). Never press anything whose accessible name matches /delete|trash|remove|clear|reset|import|export|download|print|upload|sign out|discard/i, or `input[type="file"]`. Action buttons are pointed at and focused, not pressed; workspace changes stay with the scripted scenarios.
- **Rationale**: The project's controls already declare what they open (every menu button sets `aria-haspopup` and `aria-expanded`, a rule the audit itself now enforces), so this is complete for surfaces and can not destroy data.
- **Alternatives**: Press everything and reload after each (slow; still risks downloads and pickers).

## R6. Judging and closing an opened surface

- **Decision**: After a press, wait for the page's finite animations (as today), take the set of newly open `[popover]:popover-open`, `dialog[open]` and `.peek`, run every page-side check, then press Escape, settle, and if still open click a neutral point (the top-left corner of the main area). The state after closing must match the state before opening: same open surfaces (none), the control's `aria-expanded` back to false, and its style signature equal to its pointed-at signature. Rows of an opened menu are pointed at; rows with `aria-haspopup` are pressed once to open their submenu (depth limit 2).
- **Rationale**: Covers "opens fully on screen, beside its control, closes cleanly, leaves no stuck state" with the checks the audit already trusts.
- **Alternatives**: Close by pressing the control again (not what a person usually does; misses Escape bugs).

## R7. New drawing rules

- **Decision**: Add page-side rules: `blank-icon` (an `svg` shown with no drawable child or a zero `getBBox()`), `broken-image` (`img` complete with `naturalWidth` 0), `row-misaligned` (children of a flex row with `align-items: center` whose vertical middles differ by > 1.5 px), `text-overflow` (a text run drawn past its block container's edge while the container does not scroll), `pressable-not-control` (cursor pointer, no role, not focusable), `zero-size-control`. Keep the existing rules (overflow, overlay placement, clipping, overlap, unseen text, handles, wrapped toolbars).
- **Rationale**: These are the shapes "not shown correctly" takes; each is a cheap measurement with a clear threshold.
- **Alternatives**: Visual regression against reference pictures (needs references for every screen, which is what the owner wants to avoid).

## R8. Fitting the budget

- **Decision**: Desktop width in light and dark gets the full sweep (point, focus, open); the 1024 px width gets the drawing rules in every place and every surface opened once per kind in light only. Kinds are exercised once per theme across all places. Mouse moves and checks use `page.mouse` and `page.evaluate` without Playwright's auto-waits; the settle wait is capped at one second and skipped when no animation runs.
- **Rationale**: Estimated 150 kinds × 15 ms + 40 surfaces × 250 ms + 14 places × 2 checks ≈ 15 s per theme at desktop, 10 s narrow, plus the scripted scenarios (~16 s per theme): about 70 s in all.
- **Alternatives**: Full sweep at both widths (doubles the time for little: hover rules do not change with width).

## R9. Report and comparison

- **Decision**: Findings are grouped by rule + kind + detail pattern (numbers replaced) into one entry with a count and the first instance's picture, cropped to the element with 24 px of context (`page.screenshot({ clip })`). The run writes `report.md` (ranked: behavior and invisible content first, then layout, then polish) and `findings.json`; the previous `findings.json` is read first to mark each entry new or still there and to list the fixed ones.
- **Rationale**: One readable page; the JSON makes runs comparable without any service.
- **Alternatives**: HTML report (heavier to write and to read in a terminal).

## R10. Proving the audit catches defects (and does not cry wolf)

- **Decision**: A self-test page (`scripts/ui-audit/fixtures/defects.html`) holds one broken and one correct instance of every rule: a hover that changes nothing, a hover that shifts its line, an invisible focus, a menu that leaves the window, a detached menu, a popover that ignores Escape, a stuck pressed state, a blank icon, a broken image, a misaligned row, clipped text, text in its background's color. `npm run audit:ui:self-test` loads it in Chrome (no app needed), runs the sweep and fails unless every broken instance is reported and no correct one is. Runs in a few seconds.
- **Rationale**: The owner's demand is "precise": this measures recall and precision directly, and guards the checks themselves against regressions.
- **Alternatives**: Unit tests in happy-dom (no layout, so the rules can not run there).
