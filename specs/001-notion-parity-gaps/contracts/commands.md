# Command contracts

Every change goes through `dispatch(command)`. New and changed commands,
with their payload and effect. "Patch" means a `record.update` operation on
the named record kind; all are undoable except settings.

| Command | Payload | Effect |
| --- | --- | --- |
| `view.setFilterRule` (existing, widened) | `{viewId, path, filter}` where `filter` may carry `dateEnd` and the new operator ids | patches the view's filter item |
| `view.setGroupOptions` (existing `GroupOptions` widened) | `{viewId, options: Partial<GroupBy>}` incl. `textBy`, `numberBy` | patches `groupBy` (and `subGroupBy` through `setSubGroupOptions`) |
| `view.setCountCap` | `{viewId, on: boolean}` | patches `countCap` |
| `view.setCardOptions` (existing, widened) | `{viewId, options}` incl. `card: {layout, fitMedia}` | patches `card` merged with defaults |
| `view.setCalendarOptions` (existing) | `{viewId, options: {wrapTitles}}` | patches `calendar` |
| `view.setTimelineOptions` (existing) | `{viewId, options: {separateDates, endDatePropertyId}}` | patches `timeline` |
| `view.setListOptions` | `{viewId, options: {editTitle}}` | patches `list` |
| `view.setFeedOptions` | `{viewId, options: {wrapProperties}}` | patches `feed` |
| `view.addColorRule` | `{viewId}` | appends a rule with an empty filter and color red |
| `view.setColorRule` | `{viewId, ruleId, patch: {filter?, color?, target?}}` | patches that rule |
| `view.deleteColorRule` | `{viewId, ruleId}` | removes it |
| `settings.setViewTabStyle` | `{style: "text-icon"\|"text"\|"icon"}` | patches settings; not in undo history |
| `property.setConfig` (existing) | status `{showAs}`; number `{display}` | patches the property config |
| `text.clearFormat` | `{blockId, start, end}` | removes every mark, link, color and highlight in the range |
| `row.setStatusChecked` | `{rowId, propertyId, checked}` | sets the first option of Complete (true) or To-do (false) |

## Overlays (UI contracts)

| Overlay kind | Opened from | Contents (in order) |
| --- | --- | --- |
| filter rule (existing, reshaped) | a filter chip | head "<Property> <condition> ⌄" and "…"; value control |
| filter rule menu | "…" in its head | Delete filter; Add to advanced filter |
| view tab menu | the active tab | Rename; Show as ›; Edit view; Copy link to view; Open as full page; Duplicate view; Delete view |
| tab show-as | Show as › | Text and icon; Text only; Icon only; note "Only for you" |
| conditional color panel | view settings › Conditional color | note; rules; New color setting |
| selection panel (replaces strip) | a text selection | turn-into row; Color, Bold, Italic, Underline, Clear formatting; Link, Strikethrough, Code, Equation, More; Comment |
| page outline list | pointing at the dashes | the headings, indented by level |
