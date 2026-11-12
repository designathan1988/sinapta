# Data model: Automatic interface audit

All records live in memory during a run; `Finding` groups are written to `.ui-audit/findings.json` at the end.

## Place

Somewhere a person can be.

| Field | Meaning |
| --- | --- |
| `name` | Plain words: "page Getting started", "Home", "Tasks › Board view" |
| `theme` | `light` or `dark` |
| `width` | `desktop` (1440×900) or `narrow` (1024×768) |
| `enter` | How the runner gets there: a sidebar row's label, Home, or a database tab's label |

Places are discovered from the sidebar tree and the database tabs found on database pages; nothing is listed by hand.

## Control

Something a person can point at, focus or press, as listed by `page-discover.ts`.

| Field | Meaning |
| --- | --- |
| `index` | Its position in the discovery list, used to find it again in the page |
| `kind` | See Kind |
| `label` | Accessible name, or its first words |
| `opens` | True when it declares it opens something (`aria-haspopup`, `aria-expanded`, `role="tab"`, `popovertarget`) |
| `isRisky` | True when its name or type makes pressing it destructive or leaving (R5) |
| `isFocusable` | In the tab order |
| `box` | Its rectangle when listed |

Rule: a risky control is never pressed; a control that does not open something is never pressed by the sweep.

## Kind

A key grouping identical controls: tag, role, first two class names, content shape (icon, text, both), `aria-haspopup`. One control per kind per theme is exercised; all are drawn-checked.

## Surface

What a control opens.

| Field | Meaning |
| --- | --- |
| `type` | menu, popover, dialog, peek |
| `opener` | The control that opened it |
| `depth` | 1 for a control's surface, 2 for a submenu |

Transitions: closed → opening (animating) → open (at rest, judged) → closing (Escape, then outside click) → closed (verified: no surface left, opener not expanded, opener's signature as before).

## State

A moment judged: a place, plus at most one control pointed at or focused, plus the surfaces open. Every state runs all page-side rules.

## Finding

| Field | Meaning |
| --- | --- |
| `rule` | The rule broken: e.g. `no-hover-response`, `hover-shifts-layout`, `focus-not-visible`, `overlay-offscreen`, `overlay-detached`, `not-closing`, `stuck-state`, `blank-icon`, `broken-image`, `row-misaligned`, `text-overflow`, `clipped`, `overlap`, `invisible-text`, `handle-misaligned`, `wrapped-toolbar`, `page-overflow`, `pressable-not-control`, `zero-size-control`, `console-error`, `behavior` |
| `element` | Plain words for the element |
| `place` | The place's name, theme and width |
| `state` | "at rest", "pointed at", "focused", or "with <surface> open" |
| `detail` | The measurement that broke the rule |
| `picture` | Path of the cropped PNG of the first instance |
| `count` | How many elements share it (grouped by rule + kind + detail with numbers replaced) |
| `status` | `new` or `still there`; findings of the previous run absent now are listed as `fixed` |
| `rank` | 1 behavior and unseen content, 2 layout, 3 polish |
