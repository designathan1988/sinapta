# Feature Specification: Notion parity, remaining audit gaps

**Feature Branch**: `claude/charming-darwin-7tmtef`

**Created**: 2026-11-13

**Status**: Implemented (T001–T056; amended 2026-11-13 after the converge and analyze passes)

**Input**: User description: "Notion parity, remaining gaps found by the 2026-11-13 audit (docs/notion-study.md, section 'Gaps found by the audit'). Pagecraft must match Notion's layout, behavior and words for: view tab shown as text and icon, text only or icon only; a date filter relative to today and the start or end of a range; grouping text by exact value or first letter and numbers by unique value or interval; count calculations shown as 99+; rollup filters with any / none / every; a status shown as a checkbox; card layout compact or list, gallery fit media, calendar wrap page titles, timeline separate start and end dates, list directly edit page name, feed wrap properties; conditional color; a floating outline; the text selection toolbar in Notion's new panel form; the slash menu washing its line with '/Type to search'; the filter popover in Notion's simple form; the number 'Show as' choice as three pictured tiles. Out of scope: AI, sharing, people, automations, paid-plan features. Every item checked with a photo against Notion at 1440x900 2x, and the full suite stays green."

## User Scenarios & Testing *(mandatory)*

The person is the one owner of a local workspace who already knows Notion
and expects Pagecraft to look, behave and read the same. The reference for
every scenario is the audit record in `docs/notion-study.md` and its photos.

### User Story 1 - Filter and group a database as in Notion (Priority: P1)

The owner narrows a view with a simple filter that reads like Notion's
("Due is relative to today: This week"), filters a rollup by any, none or
every related value, and groups rows by a text's first letter or a
number's interval, without learning a second way of doing it.

**Why this priority**: filtering and grouping decide which rows the owner
sees; a missing condition or grouping means the owner cannot get the view
they get in Notion at all, not merely a different look.

**Independent Test**: on a database with dated, numbered and texted rows,
add each filter and grouping from the column menu and the view settings;
the rows shown and the groups formed match the same set-up in Notion.

**Acceptance Scenarios**:

1. **Given** a view with no filters, **When** the owner filters a date
   column, **Then** the filter starts as "is relative to today · This ·
   week", lists Past / Next / This and day / week / month / year, marks
   the matching days in the month shown, and keeps only rows dated in the
   current week.
2. **Given** a date column holding ranges, **When** the owner opens its
   filter, **Then** they can choose to test the start date or the end
   date of each range.
3. **Given** a filter on any column, **When** the owner opens it from the
   filter bar, **Then** the popover reads "<Property> <condition> ⌄" with
   a "…" menu (Delete filter, Add to advanced filter) over the value,
   and the advanced form ("Where" rows, Add filter, Add filter group)
   appears only when chosen.
4. **Given** a rollup column, **When** the owner filters it, **Then** the
   first choice is Any / None / Every, followed by the condition of the
   rolled-up property's type, and rows pass accordingly.
5. **Given** a view grouped by a text column, **When** the owner sets
   "Text by" to Alphabetical, **Then** rows fall into one group per first
   letter; set back to Exact, one group per distinct value.
6. **Given** a view grouped by a number column, **When** the owner sets
   "Number by" to Interval, **Then** rows fall into ranges of equal size
   the owner can set; Unique gives one group per value.

---

### User Story 2 - Edit text with Notion's toolbar, slash menu and outline (Priority: P1)

While writing, the owner selects text and finds Notion's current panel
(turn into, formatting buttons in two rows, comment); types "/" and sees
the line washed with "/Type to search"; and on a long page jumps between
headings from the short dashes at the page's right edge.

**Why this priority**: these are on screen in every writing session; a
toolbar of another shape is the most visible difference left.

**Independent Test**: on a page with headings, select a word, type "/" on
an empty line, and point at the right edge; each matches the photos of
Notion in the audit.

**Acceptance Scenarios**:

1. **Given** a selected word, **When** the selection settles, **Then** a
   panel opens under it with: the block's type and a chevron (turn into),
   a row Color, Bold, Italic, Underline, Clear formatting, a row Link,
   Strikethrough, Code, Equation, More, and a row Comment; each button
   applies its format and shows its keyboard shortcut on hover.
2. **Given** an empty line, **When** the owner types "/", **Then** the
   line shows "/Type to search" on a washed background while the menu is
   open, and returns to normal when the menu closes.
3. **Given** a page with three or more headings, **When** it is shown,
   **Then** a column of short dashes, one per heading, sits at the page's
   right edge, longer for higher headings; pointing at it opens the list
   of headings and choosing one scrolls to it.
4. **Given** a page with fewer headings than the threshold, **When** it is
   shown, **Then** no dashes appear.

---

### User Story 3 - Present views the way Notion offers (Priority: P2)

The owner shapes each view: tabs as text and icon, text or icon; cards in
compact or list layout, a gallery fitting its media, a calendar wrapping
long titles, a timeline drawing separate start and end dates, a list whose
names are edited in place, a feed wrapping its properties; a number shown
by picking one of three pictured tiles; a status shown as a checkbox; and
large counts shortened to 99+.

**Why this priority**: each is a setting Notion has and the owner may
reach for; their absence is noticed but does not block work.

**Independent Test**: toggle every option in each view's Layout panel and
in the property and calculation menus; each change shows at once, survives
reload, and matches Notion's photo of the same option.

**Acceptance Scenarios**:

1. **Given** a view tab, **When** the owner chooses Show as › Text only or
   Icon only, **Then** the tab shows just that; the choice is the owner's
   own and stays after reload.
2. **Given** a board or gallery, **When** the owner picks Card layout
   Compact or List, **Then** properties sit side by side in one line or
   stacked one per line on each card.
3. **Given** a gallery with images, **When** Fit media is on, **Then** each
   image fits inside its card's preview area without cropping.
4. **Given** a calendar with long titles, **When** Wrap page titles is on,
   **Then** titles wrap onto more lines instead of being cut.
5. **Given** a timeline on a date range property, **When** Separate start
   and end dates is on, **Then** the owner chooses one property for the
   start and another for the end.
6. **Given** a list, **When** Directly edit page name is on, **Then**
   clicking a name edits it in place instead of opening the page.
7. **Given** a feed, **When** Wrap properties is on, **Then** long
   property values wrap instead of being cut.
8. **Given** a number property's Edit property, **When** it opens,
   **Then** "Show as" offers three pictured tiles (42 Number, Bar, Ring),
   the chosen one outlined, with the note that changes apply to every view
   showing the property.
9. **Given** a status property, **When** the owner sets Show as ›
   Checkbox, **Then** each cell shows a checkbox ticked when its value is
   in the Complete group; ticking sets the first option of Complete,
   unticking the first option of To-do.
10. **Given** a count calculation, **When** "Show large counts as 99+" is
    on, **Then** counts above 99 read "99+".

---

### User Story 4 - Color pages by rules (Priority: P3)

The owner adds conditional color rules to a view, so rows or cards that
match a filter take a background or text color, for example overdue tasks
in red.

**Why this priority**: a convenience for scanning a large database; useful
but needed least often.

**Independent Test**: add a rule "Due is before today → red background" to
a view; matching rows turn red at once, others do not, and the rule stays
after reload and applies only to that view.

**Acceptance Scenarios**:

1. **Given** a view, **When** the owner opens Conditional color, **Then**
   it explains the feature and offers "New color setting".
2. **Given** a new rule with a filter and a color, **When** rows match,
   **Then** they show the color in table, board, gallery, list and
   calendar alike; later rules do not override earlier ones on the same
   row.
3. **Given** a rule, **When** the owner deletes it, **Then** colors return
   to normal.

### Edge Cases

- A relative date filter on an empty date: the row does not pass, except
  under "is empty".
- "Next 1 week" across a year's end and weeks starting Monday or Sunday:
  the range follows the owner's week start setting.
- Alphabetical grouping of names starting with digits, emoji or accented
  letters, as Notion does (sample database, SC-002): each digit is a group
  of its own, before the letters; only A–Z are letters; accented letters,
  emoji and other symbols fall in "Other", after the letters; the empty
  group comes last.
- Interval grouping with negative numbers and an empty cell: values
  outside the range (0–1000 by default) fall in "Out of range", after the
  intervals; a "No <property>" group, first, holds empty cells.
- A rollup filter on a rollup with no relation set: the filter offers no
  conditions and no rows are hidden.
- Status shown as checkbox when the Complete group has no option: the
  checkbox cannot be ticked.
- 99+ on a percent calculation: unchanged; it applies to counts only.
- The selection panel near the window's edge: it moves inside the window.
- Outline dashes on a page with headings inside toggles: closed toggles'
  headings are listed but scrolling opens the toggle first.
- Conditional color rule whose property is deleted: the rule is removed
  with it.
- Icon-only tabs on views without an icon: the layout's icon is used.

## Requirements *(mandatory)*

### Functional Requirements

**Filters and grouping**

- **FR-001**: A date filter MUST offer "is relative to today" with Past,
  Next, This and day, week, month, year, and MUST start that way when
  added from a date column.
- **FR-002**: A date filter on range values MUST let the owner test the
  start date or the end date.
- **FR-003**: The filter popover opened from the filter bar MUST read
  "<Property> <condition> ⌄" with a "…" menu (Delete filter, Add to
  advanced filter) above the value control; the advanced rule editor MUST
  remain available from that menu and from view settings.
- **FR-004**: A rollup filter MUST start with Any, None or Every, then the
  conditions of the rolled-up value's type.
- **FR-005**: Grouping by a text MUST offer Exact and Alphabetical; by a
  number, Unique and Interval with a settable interval size.

**Editor**

- **FR-006**: Selecting text MUST open a panel in Notion's form: turn
  into row, two rows of formatting buttons (Color, Bold, Italic,
  Underline, Clear formatting / Link, Strikethrough, Code, Equation,
  More), and Comment; AI rows are left out.
- **FR-007**: While the slash menu is open its line MUST show "/Type to
  search" on a washed background.
- **FR-008**: A page with at least three headings MUST show an outline of
  short dashes at its right edge; pointing at it MUST list the headings
  and choosing one MUST scroll to it.

**View presentation**

- **FR-009**: A view tab MUST offer Show as: Text and icon, Text only,
  Icon only; the choice MUST apply to the owner's own display only and
  persist.
- **FR-010**: Board and gallery MUST offer Card layout Compact or List.
- **FR-011**: Gallery MUST offer Fit media; calendar Wrap page titles;
  timeline Separate start and end dates; list Directly edit page name;
  feed Wrap properties; each MUST take effect at once and persist.
- **FR-012**: A number's Show as MUST be chosen from three pictured tiles,
  42 Number, Bar, Ring, the chosen one outlined, followed by the note
  that changes apply to every view showing the property.
- **FR-013**: A status MUST offer Show as Checkbox or Select; as a
  checkbox it MUST tick for values in the last group and set values as in
  User Story 3 scenario 9.
- **FR-014**: Count calculations MUST offer "Show large counts as 99+",
  writing counts above 99 as "99+".

**Conditional color**

- **FR-015**: Each view MUST hold an ordered list of color rules, each a
  filter and a text or background color from Notion's ten colors.
- **FR-016**: Rows and cards matching a rule MUST show its color in every
  layout that draws rows; the first matching rule wins.

**Found while photographing (audit items 19–24)**

- **FR-020**: A date filter MUST offer "Is between" (two days, both
  included) beside "Is on or before" and "Is on or after".
- **FR-021**: A new rollup MUST work from the relation and property its
  settings show before any is chosen (the first relation, the related
  pages' titles, shown as they are).
- **FR-022**: Grouping MUST offer the title column first; text grouped by
  exact value MUST list its empty group last.
- **FR-023**: The view tab menu MUST offer, in Notion's order, Source (the
  database's name in grey; a linked view picks another), Add view to
  sidebar, Open as full page and Hide data source titles (an action; the
  layout's "Show data source title" switch is the same setting).
- **FR-024**: "Add view to sidebar" MUST add a sidebar section under the
  database's name listing the view's first pages, with Open, Add a page
  and a menu: Rename, Open in, Show (5, 10, 15, 20), Show page icon,
  Source, View, Template, Move up / Move down and Remove section; the
  section is the owner's own and survives a reload.

- **FR-025**: "Customize sidebar", at the sidebar's foot, MUST turn the
  sidebar into Notion's edit mode: every shortcut, then every section, a
  row with a grip to drag it, its icon and name, and while pointed at its
  menu (Move up, Move down; Show 5/10/15/20 for a section that lists
  pages) and "Remove from sidebar"; "Add shortcut" (search; Create: New
  page, New database; Go to: Page, Settings) and "Add section" (search;
  Pages: Database view; a section left out); a full-width "Done" ends
  it. The arrangement is the owner's own and survives a reload.

**Quality bar**

- **FR-017**: Every interface text MUST use Notion's English words as
  recorded in the audit.
- **FR-018**: Every control MUST be reachable and operable by keyboard,
  with a visible focus ring, as the rest of Pagecraft.
- **FR-019**: Every item MUST be photographed in Pagecraft and compared
  with the audit photo of Notion at the same window size before it is
  called done.

### Key Entities *(include if feature involves data)*

- **Filter condition**: a property, a condition and a value; dates add a
  relative period (direction, unit) and a range end (start or end);
  rollups add a quantifier (any, none, every).
- **Group setting**: a property and how it groups: exact or alphabetical
  for text, unique or interval (with a size) for numbers.
- **View presentation**: per-view switches (card layout, fit media, wrap
  titles, separate dates, direct edit, wrap properties) and the tab's
  show-as, which belongs to the owner's display rather than the view.
- **Property display**: a number's show-as and a status's show-as.
- **Count option**: whether a count calculation shortens large counts.
- **Color rule**: a filter and a color, kept in order on a view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 14 gap items listed in the input are present, each with
  a Pagecraft photo beside the matching Notion audit photo showing the
  same controls, words and order.
- **SC-002**: For a fixed sample database, every filter and grouping in
  User Story 1 keeps or groups exactly the same rows as Notion does for
  the same set-up.
- **SC-003**: Every new option shows its effect at once, with no visible
  delay, and survives a reload in 100% of tries.
- **SC-004**: Every new control can be reached and used with the keyboard
  alone.
- **SC-005**: The project's full automated check passes within its time
  budget (under 30 seconds in all, the tests alone under 10 seconds).
- **SC-006**: No existing behavior regresses: every existing test still
  passes.

## Assumptions

- Notion's English words are used even though the audit sometimes read
  Portuguese; both are recorded in the study.
- "Show as" for view tabs is a per-viewer preference in Notion ("Valid
  only for you"); for one person it is stored with the owner's display
  settings.
- Number grouping by interval defaults to the range 0–1000 in steps of
  100, as Notion's ("Group by interval 0 – 1000", "Group every 100").
- The alphabetical group for anything but A–Z and digits is "Other".
- The outline threshold is three headings, matching what the audit saw.
- The selection panel keeps the existing formats and adds none Pagecraft
  does not have; the AI rows Notion shows are out of scope.
- Conditional color offers the same ten colors as Notion's text and
  background colors already used in Pagecraft.
- Map view, dashboard view, people, sharing and AI stay out of scope.
- Left out of Notion's menus for the reasons above: the selection panel's
  add reaction and suggest edits (people) and AI skills (AI); the view tab
  menu's Manage in Notion Calendar (another product); Move to tab, in the
  sidebar section's and Customize sidebar's menus (the sidebar tabs are
  Notion's AI chat and Notion Calendar); in Customize sidebar, the
  shortcuts New chat, New meeting note, Chat thread, Meeting notes,
  Skills, Notion Calendar, Library, Connections and External agents (AI,
  integrations or other products) and the sections Upcoming events,
  Recents, Shared, Chats, Agents, AI notes, Notion apps and Developer
  (Notion Calendar, sharing, AI or integrations). Reactions and suggest
  edits stay out wherever Notion shows them (selection panel, comments,
  feed cards): they are for people working together.
