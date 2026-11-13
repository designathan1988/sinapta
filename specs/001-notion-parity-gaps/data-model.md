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
| numberBy | `{kind:"unique"} \| {kind:"interval", size:number>0}`, optional | numbers; absent = unique; size default 10 |

Group keys: alphabetical = first letter folded to its base letter, upper
case; digits, emoji and others = "#"; empty = "No <property>". Interval =
`floor(value/size)`, label "a to b", sorted numerically.

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
