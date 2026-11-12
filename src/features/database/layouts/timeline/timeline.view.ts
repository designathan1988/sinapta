// A timeline, as Notion's: the zoom and Today above; the rows' titles in
// a table beside, when shown; a row of time units, today's line and a
// bar per dated row from its first day to its last. A bar opens its row,
// moves with Alt and an arrow, stretches with Shift too, or is dragged.
// Rows without a date are listed under the timeline.
import { openRow } from "../../row-open.commands.ts";
import "./timeline.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { PropertyId } from "../../../../model/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { centerChild, revealOnce } from "../../../../ui/focus/index.ts";
import { renderSelect } from "../../../../ui/select/index.ts";
import { setRowValue } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { setTimelineOptions } from "../../timeline-options.commands.ts";
import { keyDays, movedDate, stretchedDate } from "./timeline-bar.ts";
import {
  selectTimeline,
  type Timeline,
  type TimelineBar,
  type TimelineZoom,
} from "./timeline.selectors.ts";

const TEXT = COPY.database;
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
}

function setDate(bar: TimelineBar, at: BarContext, value: unknown): void {
  if (value === undefined) return;
  const change = { rowId: bar.row.id, propertyId: at.propertyId, value };
  at.context.dispatch(setRowValue.create(change));
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
      if (days !== 0)
        setDate(bar, at, movedDate(bar.row.values[at.propertyId], days));
    },
    { once: true },
  );
}

function renderBar(bar: TimelineBar, at: BarContext): TemplateResult {
  const stored = bar.row.values[at.propertyId];
  const onKey = (event: KeyboardEvent): void => {
    const days = keyDays(event);
    if (days === undefined) return;
    event.preventDefault();
    const next = event.shiftKey
      ? stretchedDate(stored, days)
      : movedDate(stored, days);
    setDate(bar, at, next);
  };
  return html`<div class="timeline__lane">
    <button
      type="button"
      class="timeline__bar"
      data-row-id=${bar.row.id}
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
      <span class="timeline__today" ${ref(place(timeline.today))}></span>
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
  const at = { context, propertyId: timeline.propertyId };
  return html`<div class="timeline" data-zoom=${zoom}>
    ${renderHeader(context)}
    <div class="timeline__body">
      ${showTable ? renderTable(timeline, context) : nothing}
      ${renderChart(timeline, at)}
    </div>
    ${renderUndated(timeline, context)}
  </div>`;
}
