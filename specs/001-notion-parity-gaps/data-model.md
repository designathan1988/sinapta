# Data model: Notion parity, remaining audit gaps

Every change is an **optional** field whose absence keeps today's
behavior, so stored workspaces load unchanged (no schema version bump).
Schemas live where they live today (`src/model/`, `*.schema.ts`).

## Filter condition (`model/view.schema.ts` `filterSchema`)

| Field | Type | Rule |
| --- | --- | --- |
| propertyId | PropertyId | existing |
| operator | string | existing; new ids: `relative` (dates), `any:<id>`, `none:<id>`, `every:<id>` (rollups) |
| value | unknown | existing; for `relative`: `"past|next|this:day|week|month|year"` |
| dateEnd | `"start" \| "end"`, optional | dates only; absent = start |

Validation: `relative` operand must parse to a known direction and unit,
otherwise the condition lets every row through (as a blank operand does).

## Group setting (`groupBySchema`)

| Field | Type | Rule |
| --- | --- | --- |
| textBy | `"exact" \| "alphabetical"`, optional | text-like properties; absent = exact |
| numberBy | `{kind:"unique"} \| {kind:"interval", size:number>0, from?:number, to?:number}`, optional | numbers; absent = unique; size default 100, range 0–1000 |

Group keys (as Notion forms them, checked on the 2026-11-13 sample):
alphabetical = the first character: a digit is its own group, A–Z in
upper case, anything else (accented letters, emoji, signs) under
"Other", after the letters; empty = "No <property>". Interval = within
the range `from`–`to` (default 0–1000), `floor((value-from)/size)`,
label "a to b", sorted numerically; values outside the range under "Out
of range", last. Size default 100.

## View presentation (`viewSchema`)

| Field | Type | Default |
| --- | --- | --- |
| card | `{layout:"compact"\|"list", fitMedia:boolean}`, optional | `{layout:"list", fitMedia:false}` (Notion's board default "Lista") |
| calendar.wrapTitles | boolean, optional | false |
| timeline.separateDates | boolean, optional | false |
| timeline.endDatePropertyId | PropertyId, optional | none |
| list | `{editTitle:boolean}`, optional | false |
| feed | `{wrapProperties:boolean}`, optional | false |
| countCap | boolean, optional | false |
| colorRules | `ColorRule[]`, optional | `[]` |

### Color rule

| Field | Type | Rule |
| --- | --- | --- |
| id | string | unique within the view |
| filter | FilterGroup | same shape and matching as the view filter |
| color | one of default, gray, brown, orange, yellow, green, blue, purple, pink, red | |
| target | `"background" \| "text"` | default background; text tints the title |

First matching rule wins; a rule whose properties are all deleted is
removed with the last of them.

## Display settings (`model/workspace.schema.ts` `settingsSchema`)

| Field | Type | Default |
| --- | --- | --- |
| viewTabStyle | `"text-icon" \| "text" \| "icon"`, optional | text-icon |

Settings changes stay outside undo history, as `theme` does.

## Property display

| Property | Field | Type | Default |
| --- | --- | --- | --- |
| status | showAs | `"select" \| "checkbox"`, optional | select |
| number | display | existing `number \| bar \| ring` | number (now picked from tiles) |

Status as checkbox: checked ⇔ the value's group is `complete`; ticking
sets the first option of `complete`, unticking the first of `to-do`; with
no option in `complete` the box cannot be ticked.

## Editor state

No new store slice. The slash placeholder reads `ui.overlay` (kind
`slash-menu`, `anchorId`, `start`); the selection panel reads the existing
format range; the outline derives headings with `selectTableOfContents`.

## Template repeat (`blocks/page/page.schema.ts` `repeatSchema`) — FR-028

All new fields optional; stored repeats without them read as before.

| Field | Type | Rule |
|-------|------|------|
| `every` | `"day" \| "week" \| "month" \| "year"` | the unit |
| `next` | `YYYY-MM-DD` | the next day a row is made |
| `interval` | integer 1–99 | every this many units; 1 when missing |
| `weekdays` | integers 0 (Monday)–6 | weeks only; the weekday of the start when missing |
| `time` | `HH:MM` | around midnight when missing; due from it on its day |
| `start` | `YYYY-MM-DD` | the first day; weeks are counted from it |
| `endsAfter`, `made` | integers | stops once `made` reaches `endsAfter` |
| `endsOn` | `YYYY-MM-DD` | stops when the next day would be after it |

The eight choices (Day, Weekday, Week, 2 weeks, Month, 3 months, 6 months,
Year) are drafts of these fields, kept as "key=value" lines in the open
overlay's values until Save.

## Button automation (`properties/button/button-property.schema.ts`) — FR-030

`actions` is an ordered list of variants, run in order on a press in one
undo step:

| `kind` | Fields | Effect |
|--------|--------|--------|
| `set-values` | `values` | Edit property: sets the row's values |
| `add-page` | `databaseId`, `values` | adds a row to the database |
| `edit-pages` | `databaseId`, `filter?`, `values` | sets the values of the rows passing the filter |
| `confirm` | `message` | asked before the actions (the view's) |
| `open-page` | `pageId?`, `url?` | opens the row, a page, or a web address (the view's) |
| `define-variables` | `variables[{name, expression}]` | formulas reading the row; a value `{ variable }` takes one |

A value `{ today: true }` is the day of the press. The draft lives in the
open overlay's `draft` (state `OpenOverlay.draft`, not saved) until Save.

## Suggestions (`model/rich-text.schema.ts`, `page.schema.ts`) — FR-031

- A text span's optional `suggestion` is `"insert"` or `"delete"`; its
  `comments` hold the discussion of the suggestion.
- A discussion's optional `suggestion` (the kind), `suggestedAt` (when)
  and `quote` (the text it suggests now).
- Accept keeps an insertion and drops a deletion's text; Reject does the
  opposite; either way the discussion goes.
- `ui.suggestingPageId` (not saved) is the page in Suggesting.

## Sidebar tabs and calendar (`settingsSchema`) — FR-032, FR-033

| Field | Type | Rule |
|-------|------|------|
| `sidebarTab` | `"home" \| "calendar"` | the tab shown; Home when missing |
| `sectionTabs` | section key → tab | a section moved to a tab; Home when missing |
| `calendarViewIds` | view ids | views whose dated pages the Calendar tab lists from today on |

All kept with the settings, outside undo.

