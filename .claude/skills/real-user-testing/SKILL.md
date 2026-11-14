---
name: real-user-testing
description: Use when driving Pagecraft (or Notion beside it) with a real person's gestures in a capture plan — pointing, clicking, double- or right-clicking, dragging and dropping, resizing, selecting text, scrolling, typing, shortcuts — or when a gesture needs photographing in each of its states, with the cursor, the mouse trail or the keys drawn on the photo. Also when a gesture works in unit tests but fails or feels wrong in the app. For what to test and in which order, see feature-test-scripts.
---

# Real-user gestures

## Overview

A person is not a robot: the hand reaches in a bent, uneven stroke, lands a
little short or long and corrects, never hits the exact centre, holds each
click for a moment, shakes slightly at rest, scrolls with wheel notches,
drags more slowly than it points, types in a rhythm with slips it takes back.
An interface that only works for instant, straight, pixel-exact input is
broken for people.

**Core principle:** every gesture goes through the human hand of the capture
script (`"human"` plans), and every state of the gesture is photographed and
looked at. This skill is how to do gestures; what to test, and how to judge
the result, is the `feature-test-scripts` skill.

The project rules in CLAUDE.md still hold and come first: photos only from
`npm run capture`, read every PNG, one process at a time, subagents never run
code or browsers, stop what you start, no automated interface detectors.

## The hand (`"human"` in a capture plan)

```json
{ "human": { "seed": 23, "wpm": 50, "typos": 0.04 }, "steps": [ ... ] }
```

`"human": true` uses defaults (random seed, 45 wpm, no slips). Every pointer
and key action in the plan then goes through the hand
(`scripts/capture-gestures.ts`):

| Behaviour | Model | File |
| --- | --- | --- |
| Reach time | Fitts' law, 110 ms + 140 ms/bit, ±20 % per reach; dragging 30 % slower | `capture-motion.ts` |
| Path | cubic curve bent to one side; minimum-jerk speed peaking early | `capture-motion.ts` |
| Landing | primary stroke overshoots (3–10 %) or stops short (2–8 %), off to a side; then 1–2 corrective strokes after another look at the target | `capture-reach.ts`, `capture-sight.ts` |
| Aim | near the asked spot (`aim`), never exactly on it, always inside | `capture-motion.ts` |
| Tremor and reports | 8–12 Hz tremor under 1 px; mouse reports at 60–125 Hz, uneven; positions on device pixels | `capture-reach.ts` |
| Clicks | 60–220 ms look before pressing, button held 55–130 ms, double-click gap 70–160 ms | `capture-gestures.ts` |
| Drags | grab, wait 120–350 ms, carry, linger 150–450 ms over the target, release | `capture-gestures.ts` |
| Off-screen target | wheel in 100 px notches over the area that scrolls it; holding the button, wait at that area's edge for autoscroll (4 s), then wheel | `capture-sight.ts` |
| Typing | gaps from wpm ±30 %, slower at word starts and punctuation, thinking pauses, keys held 60–130 ms, rollover, Shift around capitals, slips on a neighbouring key fixed with Backspace | `capture-typing.ts` |
| Shortcuts | modifiers down one by one, key, then released in their own order | `capture-typing.ts` |
| Rest | the step's `wait` is a resting hand that drifts under a pixel | `capture-reach.ts` |

The seed is printed (`hand: seed N`); put it in the plan to replay the very
same hand when a run finds something.

## Step fields for gestures

Existing fields keep their meaning; with `"human"` they are done by the hand.
New fields work only with `"human"`:

| Field | Does |
| --- | --- |
| `hover` / `moveTo: sel` | reach the element and stay (button held or not) |
| `pointAt: [x, y]` | move the hand to a point without pressing (move away, clear hover) |
| `click`, `doubleClick`, `rightClick`, `clickAt` + `clicks` | reach, look, press and release (`clicks: 3` selects a paragraph) |
| `down: sel` | reach and press, **keep holding** (photo shows the pressed state) |
| `up: true` | let go where the hand is |
| `drag: sel` + `to: sel` (or `by: [dx, dy]`) | the whole drag in one step; `hold: "Alt"` for a copy |
| `hold: "Shift"` | a key held around the step's press or drag (Shift-click, Ctrl-click, Alt-drag) |
| `aim: [fx, fy]` | where in the **last element the step reaches** to aim, as fractions of its box |
| `wheel: [dx, dy]` | turn the wheel over where the hand is (after any `hover`/`pointAt`) |
| `watch: "expr"` | read the expression after every event the hand sends; print each change with its time |
| `frames: true` | a photo at every phase of the gesture (also plan-wide) — see below |

`pointAt`, `hover` and `moveTo` never press or release: with the button held
(after `down`) they carry it, so `down` → `pointAt: [x, y]` → `up` resizes
to an exact spot. `clip` replaces the whole-window photo with the region.
The hand aims at an element's own box: when the real hit area is a
pseudo-element (a 1 px resizer with a wide `::after`), `read` its rectangle
first and use `pointAt`.

Order inside one step: `offline`/`reload` → eval → `pointAt`/`hover`/`moveTo`
→ `wheel` → presses (`click` … `down`, `drag`) → `up` → **`type` → `press`**.
Typing comes before the key press, so "type a line, then Enter" is
`"type": "line\n"` or two steps. One gesture per step gives one photo per
state; prefer that.

## What is printed after each photo

A headless photo has no cursor, so the script prints what the hand did and
what a person would sense, and what went wrong behind the page:

```
.captures\pagecraft\human-overlay\07-carry.png
  did: drag 392 px in 1161 ms (planned 1116), 65 of 107 reports sent, bend 11 px, overshoot 2 px
  watched: 1 ms "" → 98 ms "dragging" → 191 ms "left|dragging" → 293 ms "before|dragging"
  pointer 858,239 (button held) on p.rich-text "Alpha line", cursor text (auto over editable)
  focus button.editor__handle "Block actions", not :focus-visible, no outline
```

- `did: … in X ms (planned Y)`: every mouse report waits for the page to take
  it, so a much longer time, or few reports sent, means the page was busy.
- `cursor`: the shape the browser shows there (pointer capture wins; `auto`
  is the I-beam over editable or selectable text).
- `did:` also reports what a person would hit: `arrived on X, but it cannot
  be seen (opacity 0.00)`, `aimed at X, but the pointer is on .Y`, `held at
  the edge 4 s: nothing scrolled`, `nothing expected appeared: did it again`.
- `focus …, :focus-visible, outline …`: where the focus is and whether its
  ring shows.
- `selected "…"`: the text selection, when there is one.
- `announced "…"`: what the live regions (`role=status`, `aria-live`) say.
- `problem:` console errors, page errors, failed requests and answers of 400
  and above during the step (address paths only).

A missed `expect` is retried once, except while the button is held.

## Frames: a photo at every phase (`"frames": true`)

With `frames` on (plan or step), the hand photographs each phase of its
gesture as it happens, beside the step's final photo:
`05-carry.1-arrived.png`, `06-drag.1-arrived.png`, `06-drag.2-pressed.png`,
`06-drag.3-carried.png`, `06-drag.4-released.png`; also `clicked`,
`right-clicked`, `typed`, `keys`. Each frame prints its path and cursor.
Open every frame like any other photo. A frame pauses the hand for the
photo (about 0.2 s): do not judge timing from a framed step; use `watch` in
a run without frames.

## Overlays: cursor, trail, keys (off by default)

```json
{ "human": { "seed": 5 }, "overlay": { "cursor": true, "trail": true, "keys": true }, "steps": [
  { "name": "clean-photo", "pointAt": [1000, 600], "overlay": false } ] }
```

`"overlay": true` turns on all three; a step's own `overlay` overrides the
plan's (`false` for a clean photo to compare with Notion). They need
`"human"`. They are drawn over the finished photo in a separate blank page,
so the page under test never gets anything injected.

| Layer | Shows |
| --- | --- |
| `cursor` | the cursor in the shape the browser shows there, one of 25 CSS cursors drawn as Windows does at 200 % (arrow, hand, I-beam, grab/grabbing, resize arrows, not-allowed, wait, progress, copy, help, zoom…). While the button is held: an orange halo. Presses of the step: a filled dot, releases a ring, a second ring for a double-click, purple for the right button |
| `trail` | every mouse report of the step as a dot, joined by a line coloured by speed (blue slow → red fast), thicker while the button is held, a square where it started, and a legend: reports, length, time, peak speed |
| `keys` | keycaps of each shortcut (`Ctrl + Shift + ↓`), typed text as the fingers struck it with slips and `⌫` (`Secp⌫ond↵`), held modifiers, wheel turns (`Wheel ↓ × 3`) |

## Photograph every state of a gesture

| State | Step |
| --- | --- |
| at rest | `pointAt` somewhere neutral first |
| pointed at | `hover` (wait ≥ 600 ms for tooltips: 500 ms delay) |
| pressed | `down` (then `up` in the next step) |
| dragging, over each drop zone | `down` handle → `moveTo` target with `aim` (`[0.5, 0.1]` before, `[0.5, 0.5]` inside, `[0.5, 0.9]` after, `[0.04, 0.5]` left side) → `up` |
| open | the click that opens it, `expect` the menu |
| focused by keyboard | `press: "Tab"` (in a text block Tab indents; start from a button) |
| after the action | the step after release / Enter, with `read` of the result |

Recipe for a drag, fully observed (Pagecraft block):

```json
{ "name": "grab", "down": ".editor__block[data-block-id] >> nth=2 >> .editor__handle[data-handle]", "wait": 250,
  "watch": "[...document.querySelectorAll('[data-dragging],[data-drop]')].map(e => e.dataset.drop ?? 'dragging').join('|')" },
{ "name": "carry", "moveTo": ".editor__block[data-block-id] >> nth=0", "aim": [0.5, 0.12], "wait": 300,
  "expect": "[data-drop=before]", "watch": "…same…" },
{ "name": "drop", "up": true, "wait": 400, "watch": "…same…",
  "read": "[...document.querySelectorAll('.editor__block [data-text]')].map(e => e.textContent).join(' / ')" },
{ "name": "undo", "press": "Control+z", "wait": 400, "read": "…order…" }
```

More gestures:
- Text selection: `down` on a text element with `aim: [0.02, 0.5]`, `moveTo` the same or another with `aim: [0.9, 0.5]`, `up`; the printed `selected "…"` shows the result.
- Shift-click / Ctrl-click: `click` with `hold: "Shift"`.
- Resize: `drag` the handle `by: [dx, 0]`, or `down` / `moveTo` / `up` to photograph mid-resize.
- Autoscroll: `down` on an item, `moveTo` a target below the fold; the hand waits at the edge and says whether the page scrolled.
- Escape mid-drag: `down`, `moveTo`, then `press: "Escape"`, then `up: true`.
- Keyboard path of a drag: click into the block's text, `press: "Control+Shift+ArrowDown"`. Sidebar pages and board cards: Alt+arrows.
- Typing faults: put a `watch` on the text being typed; every key should add exactly its character, and nothing may vanish.

Gesture numbers in Pagecraft (from `src/ui/drag/pointer-drag.ts` and the
tokens): a drag starts after 4 px; drop before / inside / after a block at
its top 30 % / middle 40 % / bottom 30 %; side drop (columns) within 10 % of
an edge; tooltips after 500 ms. Selectors and every control of a part:
`npm run inventory -- <part>`. The review account's pages change between
runs: start a plan with a step whose `read` lists the items you will index
with `nth`, or create what you test (`New page`). Notion's selectors: the
earlier Notion plans in `.captures/plans/` (`n*.json`).

## Common mistakes

| Mistake | Instead |
| --- | --- |
| `"type": "/head", "press": "Enter"` expecting the menu open before Enter | type runs first; split into steps or put the key in the text |
| Testing a drag with one `drag` step and judging only the final order | `down` / `moveTo` / `up` with `watch`, or `frames`: the feedback is in the middle |
| Trusting `expect` on a hover-revealed control | Playwright counts opacity 0 as visible; read the `did:` line (`cannot be seen`) and the photo |
| Judging the cursor from a plain photo | turn on `overlay.cursor`, or read `cursor …` in the printed lines |
| Studying a path from the end photo alone | turn on `overlay.trail`: the line shows overshoot, corrections and where the hand slowed |
| Judging timing in a step with `frames` | frames pause the hand; time with `watch` in a run without frames |
| Pressing Tab inside a text block to test focus rings | Tab indents there; start from a button or the sidebar |
| Re-running with a new random hand after a failure | add the printed seed to replay the same motion |
| Calling a gesture fine because the unit test passes | the unit tests fire synthetic events at fixed points; only the hand finds threshold, hit-area and timing faults |
| Using the browser pane or Chrome extension to look | photos come from `npm run capture` only (CLAUDE.md) |
