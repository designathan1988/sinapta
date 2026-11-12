# Feature Specification: Automatic interface audit

**Feature Branch**: `claude/charming-darwin-7tmtef`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Automatic interface audit for Pagecraft that finds interface and interaction defects across the whole app without hand-written per-screen or per-feature tests. Today `npm run audit:ui` only checks moments that scripted scenarios reach, so it missed broken hover states, elements not rendered correctly, and more. The new tool must discover every interactive element on its own, exercise each the way a person would, and judge each state against general invariants rather than per-screen expectations. It must be precise, fast, light, and leave a report the owner can read."

## Why

The owner keeps finding defects by eye that the project's checks passed: a block's handles floating a line above its heading, hover states that do nothing or jump, controls drawn wrongly. The current audit only looks where a hand-written scenario leads it, so every screen and every function needs its own script, and whatever nobody scripted goes unchecked. The owner wants one sweep that walks the whole interface on its own, the way a careful tester would, and reports every defect it meets, quickly, without a pile of per-screen tests to write and keep.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every control is pointed at, focused and judged (Priority: P1)

The owner runs one command. The audit opens the app in a fresh workspace, visits each place a person can reach (each page in the sidebar, Home, each database view), and on each finds every control a person could use: buttons, links, tabs, menu rows, fields, checkboxes, rows, cards, block handles and anything else that takes a click or a key. It points at each one and gives it the keyboard focus, as a person would, and judges the result: the control must visibly respond (its look changes) without moving anything else on the page, and its focus must be visible. Controls that only appear while their row or block is pointed at are found by pointing at that row or block first.

**Why this priority**: Broken or missing hover and focus states are the defects the owner reported and the current audit cannot see, because no scenario points at most controls. This alone covers the whole interface's first layer.

**Independent Test**: Introduce a control whose hover changes nothing, one whose hover shifts the line under it, and one whose focus ring is invisible; run the audit; all three are reported with the control named and pictured, and the rest of the interface reports nothing.

**Acceptance Scenarios**:

1. **Given** a page in the sidebar whose row shows no change when pointed at, **When** the audit runs, **Then** it reports that row with "no visible response to pointing" and a picture of it pointed at.
2. **Given** a button whose hover makes its neighbors move, **When** the audit runs, **Then** it reports the button and the moved elements with the distance they moved.
3. **Given** a block whose handles appear only while it is pointed at, **When** the audit runs, **Then** it points at the block, finds the handles and judges them like any other control.
4. **Given** a control reached by Tab whose focus cannot be seen, **When** the audit runs, **Then** it reports "focus not visible" for that control.

---

### User Story 2 - Everything that opens is opened, judged and closed (Priority: P1)

For every control that opens something (a menu, a popover, a dialog, a panel, a submenu, a picker), the audit presses it, judges what opened, then closes it the way a person would (Escape, then a click outside if needed) and checks the page came back as it was. What opened must lie fully inside the window, sit beside the control that opened it, show its content without cuts or overlaps, and close leaving nothing behind. Menus are explored one level deeper: their rows are pointed at and their submenus opened and judged the same way.

**Why this priority**: Menus and popovers are where most visible defects hid (detached menus, clipped panels, a page crushed beside the side peek), and every one of them is reachable without a script.

**Independent Test**: Introduce a menu that opens partly outside the window, one that opens far from its button, and one that leaves its button highlighted after closing; run the audit; all three are reported, each with its picture while open.

**Acceptance Scenarios**:

1. **Given** a menu whose bottom leaves the window, **When** the audit opens it, **Then** it reports the menu, the control, and how far it overflows.
2. **Given** a popover that does not close on Escape, **When** the audit closes it, **Then** it reports "does not close on Escape".
3. **Given** a control that, once its menu has closed, stays drawn as pressed, **When** the audit closes the menu, **Then** it reports the stuck state.
4. **Given** a menu row that opens a submenu, **When** the audit points at or presses it, **Then** the submenu is judged as an opened surface too.

---

### User Story 3 - Everything drawn is drawn right, in every state (Priority: P1)

In every state the audit reaches (each place, each element pointed at, each surface opened), it judges everything visible against general rules: nothing is blank, zero-size, invisible against its background, cut off, overflowing its container, covering another control, misaligned with its siblings in a row, or drawn outside the window; icons and pictures load and show; text is readable; the page never scrolls sideways; no errors are raised by the app.

**Why this priority**: Elements "not shown correctly" were the owner's second complaint; these rules catch them everywhere at once instead of screen by screen.

**Independent Test**: Introduce an icon that fails to draw, a label cut off without an ellipsis, a toolbar whose items sit at different heights, and a picture that does not load; run the audit; all four are reported.

**Acceptance Scenarios**:

1. **Given** an icon that draws nothing, **When** the audit reaches it, **Then** it reports "blank icon" with its picture.
2. **Given** a row of tools in which one sits two pixels lower than the others, **When** the audit reaches the row, **Then** it reports the misaligned tool and the offset.
3. **Given** a picture whose source fails, **When** the audit reaches it, **Then** it reports "image did not load".
4. **Given** text drawn in nearly its background's color, **When** the audit reaches it, **Then** it reports the text and its contrast.

---

### User Story 4 - A report the owner can act on in minutes (Priority: P2)

At the end the audit writes one report: each distinct defect once (the same defect on twenty identical rows is one finding with a count), ranked by how visible it is, each with the place, the element named in plain words, the state it was in, the measurement that broke the rule, and a cropped picture of the element in that state. It also says what it covered (how many places, controls and surfaces it judged) and what changed since the previous run (new, still there, fixed).

**Why this priority**: Findings are only useful if the owner can read them quickly and trust them; without grouping, one defect on every row would bury the rest.

**Independent Test**: Run the audit twice with one defect fixed in between; the second report lists that defect as fixed and the rest as still there.

**Acceptance Scenarios**:

1. **Given** the same defect on every row of a table, **When** the report is written, **Then** it appears once with the number of rows it affects and one picture.
2. **Given** a previous report, **When** a new run finishes, **Then** the report marks each finding new or still there, and lists those fixed.
3. **Given** any finding, **When** the owner opens its picture, **Then** the picture shows that element in the state in which it broke the rule.

---

### User Story 5 - Both themes and two widths, in about a minute (Priority: P2)

One command sweeps the interface in the light and the dark theme, at a desktop width and at a narrow one, and finishes in about a minute, so it can run after every change.

**Why this priority**: Defects that appear only in the dark theme or a narrower window are common; a sweep slow enough to skip is a sweep that is skipped.

**Independent Test**: Time a full run on the seeded workspace: it ends within the time budget and its report names both themes and both widths.

**Acceptance Scenarios**:

1. **Given** a defect that shows only in the dark theme, **When** the audit runs, **Then** it reports it under the dark theme.
2. **Given** the seeded workspace, **When** the full audit runs, **Then** it finishes within the time budget.

### Edge Cases

- Controls that destroy or leave: deleting, trashing, clearing, importing or exporting files, printing, opening file pickers, signing out of nothing. The audit points at and focuses them but does not press them, or presses them only where the result can be undone before going on; it never opens a native file picker, print dialog or download.
- Controls that change the workspace (new page, new row, toggles): pressed only where the change is undone or isolated so that later steps see the same interface; the sweep runs on a fresh, throwaway workspace, never the owner's data.
- Many identical controls (each row's buttons, each block's handles): one or a few of each kind are exercised, the rest only checked for drawing, so the sweep stays fast without losing kinds.
- Surfaces still animating: judged only once at rest, so a panel sliding in is not taken for a misplaced one.
- Things hidden on purpose: screen-reader-only labels, skip links, a click area's hidden hint, content scrolled out of its container. Not reported as invisible or covered.
- Emoji and glyphs whose box is wider than their drawing: judged by what is drawn.
- A control that opens nothing, or a menu that opens a menu: exploration is bounded in depth and time so it always ends.
- A state the audit cannot leave (a stuck overlay): reported, then the audit reloads the place and goes on.
- The app is not running: the audit says so plainly and stops.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The audit MUST discover, without per-screen instructions, every control a person can reach on each place it visits, including controls that only appear while their row or block is pointed at.
- **FR-002**: The audit MUST visit every place reachable from the sidebar and the Home page, and every view of every database it meets.
- **FR-003**: The audit MUST point at and focus each distinct kind of control and report when pointing produces no visible change, when pointing or focusing moves other elements, or when focus is not visible.
- **FR-004**: The audit MUST press each control that opens a surface, judge the surface open and at rest, close it as a person would, and report a surface that is outside the window, away from its control, cut, overlapping, not closing, or leaving a stuck state behind.
- **FR-005**: The audit MUST explore opened menus one level deeper, judging their rows and the submenus they open.
- **FR-006**: The audit MUST judge every visible element in every reached state for: blank or zero-size drawing, unreadable or unseen text, cut-off content without an ellipsis, overflow of its container, covering another control, misalignment within a row of siblings, presence outside the window, images and icons that fail to show, and sideways page scrolling.
- **FR-007**: The audit MUST record errors the app raises while being used.
- **FR-008**: The audit MUST NOT press destructive or leaving controls, open native file pickers, print dialogs or downloads, or touch any workspace but a fresh one of its own.
- **FR-009**: The audit MUST run in the light and dark themes and at a desktop width and a narrow width.
- **FR-010**: The audit MUST group the same defect across repeated elements into one finding with a count.
- **FR-011**: Each finding MUST name the place, the element in plain words, the state, the rule broken with its measurement, and include a cropped picture of the element in that state.
- **FR-012**: The report MUST state coverage (places, controls and surfaces judged) and compare with the previous run (new, still there, fixed).
- **FR-013**: The audit MUST end within its time budget even when the interface misbehaves, bounding exploration and recovering from stuck states.
- **FR-014**: Elements hidden on purpose (screen-reader labels, skip links, clear hint text, content scrolled out of view) and glyphs judged by their drawing MUST NOT be reported.
- **FR-015**: The scripted scenarios of the current audit (typing, the "/" menu, every block kind, the peek) MUST keep running alongside the sweep, so behavior that needs intent stays checked.

### Key Entities

- **Place**: somewhere a person can be in the app (a page, Home, a database view), in a theme and at a width.
- **Control**: something a person can point at, focus or press, with a kind (its role and look) used to group identical ones.
- **Surface**: something a control opens (menu, popover, dialog, panel, submenu, picker).
- **State**: what the interface shows at a moment: a place, with a control pointed at or focused, or a surface open.
- **Finding**: a broken rule in a state: place, element, state, rule, measurement, picture, how many elements share it, and whether it is new, still there or fixed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One command sweeps both themes at both widths in 90 seconds or less on the seeded workspace.
- **SC-002**: At least 95% of the distinct kinds of controls visible in the places visited are pointed at and focused; every control that opens a surface is opened at least once per kind.
- **SC-003**: Each defect the owner has reported so far (handles above their heading, hover with no visible change, a menu outside the window, a page crushed beside the peek, a clipped switch, text in its background's color), when reintroduced, is reported by the audit.
- **SC-004**: At least 9 in 10 findings in a report are real defects on review.
- **SC-005**: The owner can read a report and know what to fix in under 5 minutes; each finding fits on one line plus its picture.
- **SC-006**: Adding a new screen or menu to the app requires no change to the audit for it to be swept.

## Assumptions

- The audit runs against the app served locally by the project's own commands, on a fresh, throwaway workspace each run; the owner's data is never opened.
- Google Chrome is installed; no other browser or download is needed, and the tool adds nothing heavier than what the project already uses for browser control.
- The desktop width is 1440 by 900 and the narrow width 1024 by 768, matching how the interface is reviewed today.
- "Visible response to pointing" means a change in the control's own drawing (background, color, border, shadow, outline, opacity) or the appearance of something it owns; a control meant to show no hover (plain text) is identified by not being pressable.
- Destructive or leaving controls are recognized by their accessible names and roles (delete, trash, remove, clear, reset, import, export, download, print, sign out) and by attributes that open files.
- Reports are written in English, as all project documents are.
- The audit is a review tool run on demand and before calling interface work done; it is not part of the 30-second verify step.
