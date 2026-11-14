---
name: feature-test-scripts
description: Use when asked to test a feature, a part of Pagecraft, or the whole app ("test X completely", "full test", "teste completo"), to write or run a test script (roteiro) that leaves nothing out, or to know everything a feature includes before testing or changing it. Covers interface, UI/UX, front-end behaviour, persistence and server problems found by using the app as a person would.
---

# Feature test scripts

## Overview

A complete test is not a few happy paths: it is every control of the part,
in every state, by pointer and by keyboard, every menu entry, every key,
every drag and drop zone, every command's result after a reload, every
server path when it works and when it does not, and the feedback a person
gets at each moment — each one done by the human hand and photographed.

**Core principle:** the script is derived from the code as it is now
(`npm run inventory`), never from memory or an old list; every inventory
line becomes at least one case; every case is run with the gestures of the
`real-user-testing` skill and every photo is opened and judged.

CLAUDE.md comes first: photos only from `npm run capture`, read every PNG,
one process at a time (check with any other session before using capture or
the review server), subagents only read, stop what you start.

## 1. Inventory the part (about a second)

```
npm run inventory                 # every part, one line each, and the global shortcuts
npm run inventory -- sidebar      # everything about parts whose name matches
npm run inventory -- all          # everything about every part
```

For each matching part it prints: controls (tag, class, data attributes,
role, visible label, events), menu and list entries, announcements, DOM
events, keys handled, drag/drop/paste/wheel, commands dispatched, server
paths called and routes served, the parts that use it ("Used by") and the
headings of `docs/notion-study.md` about it. Then read the part's view files
for what patterns cannot see: conditions that show or hide a control (empty,
loading, error, disabled, locked page, read-only, first run), limits, and
what each command changes. Write those as states in the script.

A feature spans parts: a block's keys live in the editor, its menu entry in
the slash menu, its export in the Markdown export. Read the top files of
"Used by" and "Also mentioned in". A file is in scope when it imports the
part, uses its type or its commands, or handles its keys; a file where the
word only appears for something else (a sidebar "toggle") is out. Name both
lists in the script header. Keys handled elsewhere for this part (found in
those files) are cases like the part's own. The global shortcuts (undo,
redo, palette…) are printed by `npm run inventory` without words.

Every change a person makes goes through `dispatch` and is sent to the
server by the sync, so reload and offline cases apply to every command, even
when the part lists no server path of its own.

## 2. Write the script (roteiro)

File: `docs/test-scripts/<part with "/" as "-">.md` (`blocks-toggle.md`).
Header: part, date; counts of controls, menu entries, keys (own and
elsewhere), drags, commands, server paths, announcements; the files read,
the parts in and out of scope; the states found in the views. Then one
table row per case:

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |

Derive the cases with this matrix; every cell that applies is a case:

| From the inventory | Cases |
| --- | --- |
| each control | at rest · pointed at (hover wash, cursor, tooltip if icon-only) · pressed · result of the click · focused by keyboard (ring) · activated by keyboard (Enter/Space) · disabled or hidden states found in the view |
| each menu or list entry | open the menu by pointer and by keyboard · point at the entry · choose by click · choose by arrows + Enter · its result · Escape closes, focus returns · reopen shows the new state |
| each key handled | the key in each place it applies, and once where it must do nothing |
| each drag | every drop zone (before, inside, after, sides), drop on itself (no-op), Escape mid-drag, Alt copy if handled, autoscroll to an off-screen target, its keyboard path, undo |
| each paste, drop target, wheel | paste plain text, rich text and many lines; drop a file if handled; wheel over it |
| each command | its visible result · `read` of the data · `reload: true` and the result is still there · undo and redo |
| each server path | works (no `problem:` lines) · `offline: true` then the action, then `offline: false`: the person is told, nothing is lost after reload |
| each announcement | it is announced at the right moment (`announced` line) |
| text the person types | empty, one character, 200 characters, accents and emoji (`café 🎉`), Markdown triggers, typing with slips (`typos`) |
| every part | light and dark theme photo (`theme`), the Notion photo of the same steps, a first-run or empty state if it has one |

Then group the cases into capture plans of 10–20 steps each
(`.captures/plans/ts-<part>-<nn>.json`), each with `"human"` and
`"overlay": { "cursor": true, "trail": true, "keys": true }`:

- Gesture steps get `"frames": true`. Cases whose "Within" matters (drag
  indicator, menu opening, typing) get a second, short plan without frames
  and with `watch`: frames pause the hand.
- Plans that type triggers (`> `, `/`, `[[`, Markdown) use `"typos": 0`; the
  slips case has its own plan with `"typos": 0.05`, typing plain text.
- `theme` and `typos` are per plan: the dark-theme case and the Notion case
  are plans of their own. A Notion plan takes its selectors from the
  earlier Notion plans (`.captures/plans/n*.json`); the Notion window stays
  open, and only one capture runs at a time.
- States are reached through the app itself: the menu or setting that
  makes them (lock a page from the page menu, nest by Tab or by a drop
  inside). Find that control in the inventory of its part. A state the app
  gives no way to reach is "not run", with the reason.
- Every action has an `expect` and a `read` of its result (`read` is page
  JavaScript: `document.querySelector`, not Playwright's `text=`). Start
  each plan by creating what it tests (`New page`) or by a `read` that lists
  the items it will index.

## 3. Run and analyse every photo

Run the plans one at a time (`npm run capture -- pagecraft <plan>`). After
each run, open **every** PNG it printed, frames included, and write in the
case's Result what the photo shows, judged by this table, plus every
`problem:` line, every `did:` warning, and the cursor/focus/announced facts:

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
| error, refusal, offline | a message saying what happened and what to do; nothing lost | at once |
| undo | the previous state restored, visibly | 0.1 s |

And in every photo, as a designer would: text cut off or overlapping,
misaligned or uneven spacing, contrast, empty areas, a control with no
label, something that moved that should not have. Compare with the Notion
photo of the same case (`npm run capture -- notion <plan>`), and record
Notion's numbers in `docs/notion-study.md`.

Verdict per case: **pass**, **finding** (what is wrong, the photo, the
printed line, the owning file from `docs/ownership.md`, and whether it is
interface, UX, front end, server or data), or **not run** (why). A case with
no photo looked at is not run, whatever the plan printed.

## 4. Full test of the app

`npm run inventory` lists every part. Write one script per part, in this
order: sign-in, shell and sidebar, editor and text blocks, the other blocks,
menus (slash, block, page, mention, emoji, command palette), database and its
views, then the rest by size. Run part by part; after each part, report and
commit its script (`docs(test-scripts): <part>`), then go on. Keep a status
line per part at the top of `docs/test-scripts/README.md`: cases, pass,
findings, not run.

## Report to the person

Per part: how many cases, pass, findings, not run; each finding with its
photo path, what a person sees, the printed evidence, and where the code
is; what was not run and why. Findings go in the script file; say them in
the reply too, most serious first (lost data, broken action, server error,
missing feedback, interface, Notion difference).

## Red flags — stop and fix the script

| Thought | Reality |
| --- | --- |
| "These controls are alike, one case covers them" | Each inventory line is its own case; alike controls break separately |
| "The happy path works, the rest is edge cases" | Keyboard, Escape, undo, reload and offline are where people lose work |
| "The unit tests cover this" | They fire synthetic events; the script tests the app as used |
| "I looked at the last photo, the frames are the same" | Every PNG is opened; the frames hold the feedback |
| "No `problem:` lines printed, so the server is fine" | Also reload and check the data is still there |
| "The inventory missed it, so it is out of scope" | Read the view: the inventory finds patterns, the view has the conditions |
| "Notion comparison later" | Same steps on Notion, in the same session, or the case says not run |
