// The search's date filter, as Notion's: the field it reads ("Last
// edited" or "Created", from a list) and Clear on top, then Today, Last 7
// days and Last 30 days, a month to pick a day or a range, and Remove.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeChildOverlay,
  openChildOverlay,
  setOverlayValues,
  type SearchDateFilter,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  monthOf,
  renderDatePicker,
  type DateRangeValue,
} from "../../ui/date-picker/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import {
  childIndexOf,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { changeFilters, type FilterContext } from "./search-filter-context.ts";

export const DATE_ANCHOR = "search-date";
const FIELD_ANCHOR = "search-date-field";
const MONTH = "search-month";
const TEXT = COPY.palette;
const PRESETS = ["today", "week", "month"] as const;
const FIELDS = ["edited", "created"] as const;

function setDate(context: FilterContext, date: SearchDateFilter | null): void {
  changeFilters(context, { date });
}

function renderFieldList(
  context: FilterContext,
  date: SearchDateFilter,
): TemplateResult {
  return renderMenu({
    label: TEXT.dateField,
    role: "listbox",
    isChild: true,
    items: FIELDS.map((field) => ({
      label: TEXT.dateFields[field],
      check: "radio",
      isChecked: date.field === field,
      onSelect: () => {
        setDate(context, { ...date, field });
      },
    })),
    onClose: () => context.dispatch(closeChildOverlay.create({ depth: 1 })),
  });
}

function renderHead(
  context: FilterContext,
  date: SearchDateFilter,
): TemplateResult {
  const isListOpen = childIndexOf(context.state.ui.overlay, FIELD_ANCHOR) === 1;
  return html`<div class="command-palette__date-head">
    <span class="command-palette__filter">
      <button
        type="button"
        class="command-palette__date-field"
        data-overlay-child-anchor
        aria-haspopup="listbox"
        aria-expanded=${String(isListOpen)}
        @click=${() => {
          context.dispatch(
            isListOpen
              ? closeChildOverlay.create({ depth: 1 })
              : openChildOverlay.create({ anchorId: FIELD_ANCHOR, depth: 1 }),
          );
        }}
      >
        <span>${TEXT.dateFields[date.field]}</span>${renderIcon("chevron")}
      </button>
      ${isListOpen ? renderFieldList(context, date) : nothing}
    </span>
    <button
      type="button"
      class="command-palette__date-clear"
      @click=${() => {
        setDate(context, { ...date, range: null });
      }}
    >
      ${TEXT.clearDate}
    </button>
  </div>`;
}

function renderPresets(
  context: FilterContext,
  date: SearchDateFilter,
): TemplateResult {
  return html`<div class="command-palette__date-presets" role="group">
    ${PRESETS.map(
      (kind, index) =>
        html`<button
          type="button"
          class="command-palette__date-row"
          ?data-autofocus=${index === 0}
          aria-pressed=${String(date.range?.kind === kind)}
          @click=${() => {
            setDate(context, { ...date, range: { kind } });
          }}
        >
          <span>${TEXT.datePresets[kind]}</span>
          ${date.range?.kind === kind ? renderIcon("check") : nothing}
        </button>`,
    )}
  </div>`;
}

// The days as the month picker holds them, and back.
function pickedOf(date: SearchDateFilter): DateRangeValue | undefined {
  const { range } = date;
  return range?.kind === "days"
    ? { start: range.from, end: range.to }
    : undefined;
}

function renderMonth(
  context: FilterContext,
  date: SearchDateFilter,
  today: string,
): TemplateResult {
  const picked = pickedOf(date);
  const month =
    context.state.ui.overlay?.values?.[MONTH]?.[0] ??
    monthOf(picked?.start ?? today);
  return renderDatePicker({
    label: TEXT.date,
    value: picked,
    month,
    today,
    hasFields: false,
    onChange: (next) => {
      setDate(context, {
        ...date,
        range:
          next === undefined
            ? null
            : { kind: "days", from: next.start, to: next.end ?? next.start },
      });
    },
    onMonth: (next) => {
      context.dispatch(
        setOverlayValues.create({ name: MONTH, values: [next] }),
      );
    },
  });
}

export function renderDateFilter(
  context: FilterContext,
  date: SearchDateFilter,
): TemplateResult {
  const today = new Date().toLocaleDateString("en-CA");
  const close = (): void => {
    context.dispatch(closeChildOverlay.create({ depth: 0 }));
  };
  return html`<div
    class="command-palette__date"
    popover="manual"
    data-overlay
    data-child
    role="dialog"
    aria-label=${TEXT.date}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }}
  >
    ${renderHead(context, date)} ${renderPresets(context, date)}
    ${renderMonth(context, date, today)}
    <button
      type="button"
      class="command-palette__date-row"
      @click=${() => {
        setDate(context, null);
        close();
      }}
    >
      ${renderIcon("trash")}<span>${TEXT.removeDate}</span>
    </button>
  </div>`;
}
