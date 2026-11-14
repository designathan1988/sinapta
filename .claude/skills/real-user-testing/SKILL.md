---
name: real-user-testing
description: Use when testing Pagecraft (or Notion beside it) the way a real person uses it — pointing, clicking, double- or right-clicking, dragging and dropping, resizing, selecting text, scrolling, typing, shortcuts, menus — or when checking that every action gives the person visible, timely feedback (hover, pressed, focus ring, cursor, drop indicator, announcement, undo). Also when a gesture works in unit tests but fails or feels wrong in the app, or a drag, hover menu or tooltip needs checking with real mouse movement.
---

# Real-user testing

## Overview

A person is not a robot: the hand reaches in a bent, uneven stroke, lands a
little short or long and corrects, never hits the exact centre, holds each
click for a moment, shakes slightly at rest, scrolls with wheel notches,
drags more slowly than it points, types in a rhythm with slips it takes back.
An interface that only works for instant, straight, pixel-exact input is
broken for people. And every action needs an answer the person can see in
time: something must change on hover, on press, during a drag, on drop, on
focus, on error.

**Core principle:** drive the app with the human hand of the capture script
(`"human"` plans), photograph every state of every gesture, and judge the
feedback from the photos plus the printed facts — never from code reading
or a passing unit test.

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
| `click`, `doubleClick`, `rightClick`, `clickAt` + `clicks` | reach, look, press and release |
| `down: sel` | reach and press, **keep holding** (photo shows the pressed state) |
| `up: true` | let go where the hand is |
| `drag: sel` + `to: sel` (or `by: [dx, dy]`) | the whole drag in one step; `hold: "Alt"` for a copy |
| `aim: [fx, fy]` | where in the **last element the step reaches** to aim, as fractions of its box |
| `wheel: [dx, dy]` | turn the wheel over where the hand is (after any `hover`/`pointAt`) |
| `watch: "expr"` | read the expression after every event the hand sends; print each change with its time |

`pointAt`, `hover` and `moveTo` never press or release: with the button held
(after `down`) they carry it, so `down` → `pointAt: [x, y]` → `up` resizes
to an exact spot. `clip` replaces the whole-window photo with the region.
The hand aims at an element's own box: when the real hit area is a
pseudo-element (a 1 px resizer with a wide `::after`), `read` its rectangle
first and use `pointAt`.

Order inside one step: eval → `pointAt`/`hover`/`moveTo` → `wheel` → presses
(`click` … `down`, `drag`) → `up` → **`type` → `press`**. Typing comes before
the key press, so "type a line, then Enter" is `"type": "line\n"` or two
steps. One gesture per step gives one photo per state; prefer that.

After each photo the script prints what the hand did and what a person
would sense, because a headless photo has no cursor:

```
.captures\pagecraft\human-verify\04-carry.png [236,30]
  did: drag 402 px, 81 events, bend 15 px, overshoot 0 px
  watched: 1 ms "" → 326 ms "after@Second line" → 390 ms "inside@Second line" → 440 ms "before@Second line" → 490 ms "" → 507 ms "after@First line" → 540 ms "inside@First line" → 883 ms "before@First line"
  pointer 872,242 (button held) on p.rich-text "First line", cursor auto
  focus button.editor__handle "Block actions", not :focus-visible, no outline
```

Read it as a person: the indicator swept the zones the hand passed over, then
settled before "First line" and stayed (no flicker at rest); the cursor
while carrying is the text cursor, not `grabbing` (compare with Notion). A
`watch` on the editor's text while typing once showed `"Third " → "" →
"Third "` and the later keys lost: text vanishing under typing is the kind of
fault only this rhythm finds.

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
| `cursor` | the cursor in the shape the browser shows there, one of 25 CSS cursors drawn as Windows does at 200 % (arrow, hand, I-beam, grab/grabbing, resize arrows, not-allowed, wait, progress, copy, help, zoom…); while an element holds the pointer capture its cursor wins; `auto` is the I-beam over editable or selectable text. While the button is held: an orange halo. Presses of the step: a filled dot, releases a ring, a second ring for a double-click, purple for the right button |
| `trail` | every mouse report of the step as a dot, joined by a line coloured by speed (blue slow → red fast), thicker while the button is held, a square where it started, and a legend: reports, length, time, peak speed |
| `keys` | keycaps of each shortcut (`Ctrl + Shift + ↓`), typed text as the fingers struck it with slips and `⌫` (`Secp⌫ond↵`), held modifiers, wheel turns (`Wheel ↓ × 3`) |

The printed `did: move … in 1073 ms (planned 1035), 53 of 115 reports sent`
compares the plan with what the page allowed: every report waits for the page
to take it, so a much longer time or few reports sent means the page was busy
(a performance finding), as long as nothing else is running.

`did:` lines also report problems a person would hit: `arrived on X, but it
cannot be seen (opacity 0.00)`, `aimed at X, but the pointer is on .Y`,
`held at the edge 4 s: nothing scrolled`, `nothing expected appeared: did it
again`. A missed `expect` is retried once, except while the button is held.

## Photograph every state

For each control, one step per state, in Pagecraft and in Notion:

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
- Escape mid-drag: `down`, `moveTo`, then `press: "Escape"`, then `up: true`; the order must be unchanged.
- Keyboard path for every drag (required by `.claude/rules/ui.md`): click into the block's text, `press: "Control+Shift+ArrowDown"`; the order changes and "Block moved." is announced. Sidebar pages and board cards: Alt+arrows.
- Typing faults: put a `watch` on the text being typed; every key should add exactly its character, and nothing may vanish.

Where Pagecraft's surfaces, selectors and thresholds are: read
[pagecraft-surfaces.md](pagecraft-surfaces.md). The review account's pages
change between runs: start every plan with a step whose `read` lists the
items you will index with `nth`, or create what you test (`New page`).
Notion's selectors: the earlier Notion plans in `.captures/plans/` (`n*.json`)
and `docs/notion-study.md`.

## Judge the feedback

For every action, answer from the photo and the printed lines:

| Action | The person must see | Within |
| --- | --- | --- |
| point at anything clickable | a wash or highlight; cursor `pointer` (or `grab`, resize cursors) | 0.1 s |
| point and wait | a tooltip on icon-only buttons | 0.5–1 s |
| press | a pressed or active state, or the result itself | 0.1 s |
| drag past the threshold | the item marked as lifted; a drop indicator under the pointer that follows it without flicker | 0.1 s |
| drop | the item in its new place, the indicator gone, an announcement, focus kept sensibly | 0.1 s |
| type | each character at once; Markdown and menu triggers react at their key | 0.1 s |
| keyboard focus | a visible ring on the focused control (contenteditable text is the agreed exception) | at once |
| open a menu | the menu at the pointer or anchor, first item ready, Escape closes and focus returns | 0.1 s |
| slow work | a progress or saving state | 1 s |
| error or refusal | a message saying what happened and what to do | at once |
| undo | the previous state restored, visibly | 0.1 s |

Use `watch` timings for "within"; a photo only shows the end. Feedback that
appears late, flickers between zones, sits away from the pointer, or never
appears is a finding even when the action itself worked. Compare each
finding with Notion by running the same steps with Notion's selectors
(`npm run capture -- notion plan.json`); record the numbers under the
control's section in `docs/notion-study.md`.

## Report

Per gesture: the step names and PNG paths, what the person sees (from the
photo), the printed facts that matter (cursor, focus, announced, watched
times), Notion's value beside it, and a verdict: matches, finding (what is
missing or wrong, and where the owning code is), or not tested (why).

## Common mistakes

| Mistake | Instead |
| --- | --- |
| `"type": "/head", "press": "Enter"` expecting the menu open before Enter | type runs first; split into steps or put the key in the text |
| Testing a drag with one `drag` step and judging only the final order | `down` / `moveTo` / `up` with `watch`: the feedback is in the middle |
| Trusting `expect` on a hover-revealed control | Playwright counts opacity 0 as visible; read the `did:` line (`cannot be seen`) and the photo |
| Judging the cursor from a plain photo | headless photos have no cursor: turn on `overlay.cursor`, or read `cursor …` in the printed lines |
| Studying a path from the end photo alone | turn on `overlay.trail`: the line shows overshoot, corrections and where the hand slowed |
| Pressing Tab inside a text block to test focus rings | Tab indents there; start from a button or the sidebar |
| Re-running with a new random hand after a failure | add the printed seed to replay the same motion |
| Calling a gesture fine because the unit test passes | the unit tests fire synthetic events at fixed points; only the hand finds threshold, hit-area and timing faults |
| Using the browser pane or Chrome extension to look | photos come from `npm run capture` only (CLAUDE.md) |
