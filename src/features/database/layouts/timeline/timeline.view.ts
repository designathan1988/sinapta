// A timeline, as Notion's: the zoom and Today above; the rows' titles in
// a table beside, when shown; a row of time units, today's line and a
// bar per dated row from its first day to its last. A bar opens its row,
// moves with Alt and an arrow, stretches with Shift too, or is dragged.
// Rows without a date are listed under the timeline.
import { selectRowColor } from "../../row-color.selectors.ts";
import { renderManageInCalendar } from "../../view-calendar-item.ts";
import { openRow } from "../../row-open.commands.ts";
import "./timeline.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parsePropertyId, type PropertyId } from "../../../../model/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { centerChild, revealOnce } from "../../../../ui/focus/index.ts";
import { renderSelect } from "../../../../ui/select/index.ts";
import { setRowValue } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { setTimelineOptions } from "../../timeline-options.commands.ts";
import { barChanges, keyDays, type BarMove } from "./timeline-bar.ts";
import {
  selectTimeline,
  type Timeline,
  type TimelineBar,
  type TimelineZoom,
} from "./timeline.selectors.ts";

const TEXT = COPY.database;
// Today's line runs down the middle of today, under its number.
const HALF_DAY = 0.5;
const ZOOMS: readonly TimelineZoom[] = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
];

// Where an element sits on the timeline: days from its start, and how
// many it covers. Set through the CSSOM: they change with every row.
function place(offset: number, span = 1) {
  return (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement)) return;
    element.style.setProperty("--offset", String(offset));
    element.style.setProperty("--span", String(span));
  };
}

function title(row: TableRow): string {
  return row.title === "" ? COPY.sidebar.untitled : row.title;
}

interface BarContext {
  readonly context: TableContext;
  readonly propertyId: PropertyId;
  readonly endId: PropertyId | undefined;
}

function shiftBar(bar: TimelineBar, at: BarContext, move: BarMove): void {
  const dates = { startId: at.propertyId, endId: at.endId };
  for (const { propertyId, value } of barChanges(bar.row.values, dates, move)) {
    const id = parsePropertyId(propertyId);
    const rowId = bar.row.id;
    if (id !== undefined)
      at.context.dispatch(setRowValue.create({ rowId, propertyId: id, value }));
  }
}

// A drag moves the bar by the whole days the pointer went.
function startDrag(event: PointerEvent, bar: TimelineBar, at: BarContext) {
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement) || event.button !== 0) return;
  const dayWidth = element.offsetWidth / bar.span;
  const from = event.clientX;
  element.setPointerCapture(event.pointerId);
  element.addEventListener(
    "pointerup",
    (up: PointerEvent) => {
      const days = Math.round((up.clientX - from) / dayWidth);
      if (days !== 0) shiftBar(bar, at, { days, stretch: false });
    },
    { once: true },
  );
}

function renderBar(bar: TimelineBar, at: BarContext): TemplateResult {
  const onKey = (event: KeyboardEvent): void => {
    const days = keyDays(event);
    if (days === undefined) return;
    event.preventDefault();
    shiftBar(bar, at, { days, stretch: event.shiftKey });
  };
  return html`<div class="timeline__lane">
    <button
      type="button"
      class="timeline__bar"
      data-row-id=${bar.row.id}
      data-color=${selectRowColor(at.context.model, bar.row, at.context.state) ?? nothing}
      aria-description=${TEXT.moveBarHint}
      ${ref(place(bar.offset, bar.span))}
      @click=${() => at.context.dispatch(openRow.create({ rowId: bar.row.id, viewId: at.context.model.view.id }))}
      @keydown=${onKey}
      @pointerdown=${(event: PointerEvent) => {
        startDrag(event, bar, at);
      }}
    >
      <span class="timeline__bar-title">${title(bar.row)}</span>
    </button>
  </div>`;
}

function renderHeader(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const viewId = model.view.id;
  const today = (event: Event): void => {
    if (!(event.currentTarget instanceof Element)) return;
    const timeline = event.currentTarget.closest(".timeline");
    const scroller = timeline?.querySelector(".timeline__scroll");
    if (scroller != null)
      centerChild(scroller, scroller.querySelector(".timeline__today"));
  };
  return html`<header class="timeline__header">
    ${renderManageInCalendar(context)}
    ${renderSelect(
      {
        id: `timeline-zoom-${viewId}`,
        label: TEXT.timelineZoom,
        value: model.view.timeline.zoom,
        options: ZOOMS.map((zoom) => ({
          value: zoom,
          label: TEXT.timelineZooms[zoom],
        })),
        variant: "quiet",
        onChoose: (value) => {
          const zoom = ZOOMS.find((item) => item === value);
          if (zoom === undefined) return;
          dispatch(setTimelineOptions.create({ viewId, options: { zoom } }));
        },
      },
      { overlay: state.ui.overlay, dispatch },
    )}
    <button type="button" class="timeline__today-button" @click=${today}>
      ${TEXT.today}
    </button>
  </header>`;
}

function renderTable(timeline: Timeline, context: TableContext) {
  return html`<div class="timeline__table" role="list" aria-label=${TEXT.rows}>
    <div class="timeline__table-head">${TEXT.titleColumn}</div>
    ${timeline.bars.map(
      (bar) =>
        html`<div class="timeline__row" role="listitem">
          <button
            type="button"
            class="timeline__title"
            data-row-id=${bar.row.id}
            @click=${() => context.dispatch(openRow.create({ rowId: bar.row.id, viewId: context.model.view.id }))}
          >
            ${title(bar.row)}
          </button>
        </div>`,
    )}
  </div>`;
}

// Each day's number under the units, today's in red, as Notion's.
function renderDays(timeline: Timeline): TemplateResult | typeof nothing {
  if (timeline.days.length === 0) return nothing;
  return html`<div class="timeline__days" aria-hidden="true">
    ${timeline.days.map(
      (day) =>
        html`<span
          class="timeline__day"
          ?data-today=${day.offset === timeline.today}
          ${ref(place(day.offset))}
          ><span>${day.label}</span></span
        >`,
    )}
  </div>`;
}

function renderChart(timeline: Timeline, at: BarContext): TemplateResult {
  return html`<div
    class="timeline__scroll"
    ${ref(revealOnce(".timeline__today"))}
  >
    <div class="timeline__canvas" ${ref(place(0, timeline.length))}>
      <div class="timeline__units">
        ${timeline.units.map(
          (unit) =>
            html`<span
              class="timeline__unit"
              ${ref(place(unit.offset, unit.span))}
              >${unit.label}</span
            >`,
        )}
      </div>
      ${renderDays(timeline)}
      <span
        class="timeline__today"
        ${ref(place(timeline.today + HALF_DAY))}
      ></span>
      ${timeline.bars.map((bar) => renderBar(bar, at))}
    </div>
  </div>`;
}

function renderUndated(timeline: Timeline, context: TableContext) {
  if (timeline.undated.length === 0) return nothing;
  return html`<section class="timeline__undated">
    <h2 class="timeline__undated-title">${TEXT.noDate}</h2>
    ${timeline.undated.map(
      (row) =>
        html`<button
          type="button"
          class="timeline__title"
          @click=${() => context.dispatch(openRow.create({ rowId: row.id, viewId: context.model.view.id }))}
        >
          ${title(row)}
        </button>`,
    )}
  </section>`;
}

export function renderTimeline(context: TableContext): TemplateResult {
  const { zoom, showTable } = context.model.view.timeline;
  const today = new Date().toLocaleDateString("en-CA");
  const timeline = selectTimeline(context.model, { zoom, today });
  if (timeline === undefined) {
    return html`<p class="timeline__empty">${TEXT.noDateProperty}</p>`;
  }
  const { separateDates, endDatePropertyId } = context.model.view.timeline;
  const endId = separateDates === true ? endDatePropertyId : undefined;
  const at = { context, propertyId: timeline.propertyId, endId };
  return html`<div
    class="timeline"
    data-zoom=${zoom}
    ?data-numbered=${timeline.days.length > 0}
  >
    ${renderHeader(context)}
    <div class="timeline__body">
      ${showTable ? renderTable(timeline, context) : nothing}
      ${renderChart(timeline, at)}
    </div>
    ${renderUndated(timeline, context)}
  </div>`;
}
