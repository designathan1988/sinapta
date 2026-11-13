// How a view groups text and numbers, as Notion's "Text by" (Exact,
// Alphabetical) and "Number by" (Unique, Interval) rows; an interval
// also takes its size.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../blocks/database/index.ts";
import type { GroupBy } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuItem } from "../../../ui/menu/index.ts";
import { setGroupOptions, type GroupOptions } from "../group.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT_TYPES = new Set(["text", "url", "email", "phone"]);

// An interval's size until one is typed, as Notion's.
const DEFAULT_INTERVAL = 100;
const TEXT = COPY.database;

function set(context: TableContext, options: GroupOptions): void {
  const viewId = context.model.view.id;
  context.dispatch(setGroupOptions.create({ viewId, options }));
}

// The "Text by" or "Number by" row for a property that has one.
export function groupByKindRows(
  context: TableContext,
  property: PropertyDefinition,
  groupBy: GroupBy,
): MenuItem[] {
  const { textGroupings, numberGroupings } = COPY.database;
  if (TEXT_TYPES.has(property.type)) {
    const value = textGroupings[groupBy.textBy ?? "exact"];
    const row = { label: COPY.database.textBy, icon: "text", value } as const;
    return [panelRow(context, row, "group-text")];
  }
  if (property.type !== "number") return [];
  const value = numberGroupings[groupBy.numberBy?.kind ?? "unique"];
  const row = { label: COPY.database.numberBy, icon: "number", value } as const;
  return [panelRow(context, row, "group-number")];
}

export function groupTextPanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.textGroupings;
  return {
    title: COPY.database.textBy,
    back: "group",
    items: choiceItems(context, {
      choices: (["exact", "alphabetical"] as const).map((value) => ({
        value,
        label: labels[value],
      })),
      value: context.model.view.groupBy?.textBy ?? "exact",
      back: "group",
      choose: (textBy) => {
        set(context, { textBy });
      },
    }),
  };
}

type IntervalBy = Extract<GroupBy["numberBy"], { kind: "interval" }>;
type IntervalField = "from" | "to" | "size";

// One number of the interval, kept when its field is left; a size must
// be above zero.
function renderNumberField(
  context: TableContext,
  by: IntervalBy,
  field: IntervalField,
): TemplateResult {
  const current =
    by[field] ??
    (field === "size" ? DEFAULT_INTERVAL : field === "from" ? 0 : 1000);
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const next = Number(event.target.value);
    const isValid = Number.isFinite(next) && (field !== "size" || next > 0);
    if (!isValid) {
      event.target.value = String(current);
      return;
    }
    set(context, { numberBy: { ...by, [field]: next } });
  };
  const labels = {
    from: TEXT.intervalFrom,
    to: TEXT.intervalTo,
    size: TEXT.intervalSize,
  };
  return html`<input
    class="database__field"
    type="number"
    step="any"
    inputmode="decimal"
    aria-label=${labels[field]}
    data-interval=${field}
    .value=${String(current)}
    @change=${onChange}
  />`;
}

// Notion's interval settings: the range, from and to, then the size.
function renderInterval(context: TableContext, by: IntervalBy): TemplateResult {
  return html`<div class="view-settings__field">
      <span>${TEXT.intervalRange}</span>
      ${renderNumberField(context, by, "from")} –
      ${renderNumberField(context, by, "to")}
    </div>
    <div class="view-settings__field">
      <span>${TEXT.intervalSize}</span>
      ${renderNumberField(context, by, "size")}
    </div>`;
}

export function groupNumberPanel(context: TableContext): SettingsPanel {
  const labels = COPY.database.numberGroupings;
  const by = context.model.view.groupBy?.numberBy;
  const size = by?.kind === "interval" ? by.size : DEFAULT_INTERVAL;
  return {
    title: COPY.database.numberBy,
    back: "group",
    items: choiceItems(context, {
      choices: (["unique", "interval"] as const).map((value) => ({
        value,
        label: labels[value],
      })),
      value: by?.kind ?? "unique",
      back: "group-number",
      choose: (kind) => {
        const numberBy =
          kind === "interval" ? { kind, size } : ({ kind } as const);
        set(context, { numberBy });
      },
    }),
    ...(by?.kind === "interval" && { lead: renderInterval(context, by) }),
  };
}
