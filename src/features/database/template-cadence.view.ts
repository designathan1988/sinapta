// "Edit cadence", as Notion's: Every N units, the weekdays of a week, At,
// Start, Ending, the time zone, Cancel recurrence and the next occurrence,
// with Save at its top. Escape asks "Discard unsaved changes?" first.
import "./template-cadence.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { selectPage, REPEAT_PERIODS } from "../../blocks/page/index.ts";
import { closeOverlay, setOverlayValues } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderConfirm } from "../../ui/confirm/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import {
  changeDraft,
  dayLabel,
  renderAtRow,
  renderDayRow,
  renderEndingRows,
  renderTimeZoneRow,
  type CadenceContext,
} from "./template-cadence-rows.view.ts";
import { draftCadence, repeatDraft, writeDraft } from "./template-cadence.ts";
import { firstNext, setTemplateRepeat } from "./template-repeat.commands.ts";

const TEXT = COPY.cadence;
const ASKING = "cadence-asking";

function renderEvery(context: CadenceContext): TemplateResult {
  const { state, dispatch, draft, templateId } = context;
  const units = draft.interval > 1 ? TEXT.unitsPlural : TEXT.units;
  return html`<div class="cadence__row">
    <span class="cadence__label">${TEXT.every}</span>
    <input
      class="cadence__number"
      type="number"
      min="1"
      max="99"
      aria-label=${TEXT.interval}
      .value=${String(draft.interval)}
      @change=${(event: Event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        changeDraft(context, { interval: Number(event.target.value) });
      }}
    />
    ${renderSelect(
      {
        id: `cadence-unit:${templateId}`,
        label: TEXT.unit,
        value: draft.every,
        variant: "field",
        options: REPEAT_PERIODS.map((value) => ({
          value,
          label: units[value],
        })),
        onChoose: (value) => {
          const every = REPEAT_PERIODS.find((each) => each === value);
          if (every !== undefined) changeDraft(context, { every });
        },
      },
      { overlay: state.ui.overlay, dispatch },
    )}
  </div>`;
}

// Monday to Sunday; a week keeps at least one.
function renderWeekdays(context: CadenceContext): TemplateResult {
  const { weekdays } = context.draft;
  const toggle = (day: number) => (): void => {
    const next = weekdays.includes(day)
      ? weekdays.filter((each) => each !== day)
      : [...weekdays, day].sort((a, b) => a - b);
    if (next.length > 0) changeDraft(context, { weekdays: next });
  };
  return html`<div class="cadence__weekdays" role="group">
    ${TEXT.weekdays.map(
      (label, day) =>
        html`<button
          type="button"
          class="cadence__weekday"
          aria-pressed=${String(weekdays.includes(day))}
          aria-label=${TEXT.weekdayNames[day] ?? label}
          @click=${toggle(day)}
        >
          ${label}
        </button>`,
    )}
  </div>`;
}

// "Next occurrence:" and when.
function renderNext(context: CadenceContext): TemplateResult {
  const { draft, today } = context;
  const next = firstNext(draftCadence(draft), today);
  const at =
    draft.time === "" ? TEXT.nextMidnight : draft.time.replace(/^0/, "");
  return html`<p class="cadence__next">
    ${TEXT.next}<br />${TEXT.nextAt(dayLabel(next, today), at)}
  </p>`;
}

function isChanged(context: CadenceContext): boolean {
  const saved = selectPage(context.state, context.templateId)?.props.repeat;
  if (saved === undefined) return true;
  const now = writeDraft({ ...context.draft, month: "" }).join();
  const before = writeDraft({
    ...repeatDraft(saved, context.today),
    month: "",
  });
  return now !== before.join();
}

function save(context: CadenceContext): void {
  const { dispatch, templateId, today } = context;
  const cadence = draftCadence(context.draft);
  dispatch(setTemplateRepeat.create({ templateId, cadence, today }));
  dispatch(closeOverlay.create({}));
}

function stop(context: CadenceContext): void {
  const { dispatch, templateId, today } = context;
  dispatch(setTemplateRepeat.create({ templateId, cadence: null, today }));
  dispatch(closeOverlay.create({}));
}

function renderDiscard(
  context: CadenceContext,
): TemplateResult | typeof nothing {
  const { state, dispatch } = context;
  if (state.ui.overlay?.values?.[ASKING] === undefined) return nothing;
  return renderConfirm({
    question: TEXT.discardQuestion,
    answer: TEXT.discard,
    cancel: TEXT.discardCancel,
    icon: "trash",
    onAnswer: () => dispatch(closeOverlay.create({})),
    onCancel: () =>
      dispatch(setOverlayValues.create({ name: ASKING, values: null })),
  });
}

function onKey(event: KeyboardEvent, context: CadenceContext): void {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  event.preventDefault();
  event.stopPropagation();
  const { dispatch } = context;
  dispatch(
    isChanged(context)
      ? setOverlayValues.create({ name: ASKING, values: ["discard"] })
      : closeOverlay.create({}),
  );
}

// "Edit cadence", and Save at its end.
function renderHead(context: CadenceContext): TemplateResult {
  return html`<div class="cadence__head">
    <span>${TEXT.title}</span>
    <button
      type="button"
      class="cadence__save"
      data-autofocus
      @click=${() => {
        save(context);
      }}
    >
      ${TEXT.save}
    </button>
  </div>`;
}

export function renderCadencePanel(context: CadenceContext): TemplateResult {
  const { draft } = context;
  return html`<div
      class="cadence"
      popover="manual"
      data-overlay
      role="dialog"
      aria-label=${TEXT.title}
      ${ref(showPopoverWhenConnected)}
      @keydown=${(event: KeyboardEvent) => {
        onKey(event, context);
      }}
    >
      ${renderHead(context)} ${renderEvery(context)}
      ${draft.every === "week" ? renderWeekdays(context) : nothing}
      ${renderAtRow(context)}
      <hr class="cadence__divider" />
      ${renderDayRow(context, { key: "start", label: TEXT.start })}
      ${renderEndingRows(context)} ${renderTimeZoneRow()}
      <hr class="cadence__divider" />
      <button
        type="button"
        class="cadence__cancel"
        @click=${() => {
          stop(context);
        }}
      >
        ${TEXT.cancel}
      </button>
      <hr class="cadence__divider" />
      ${renderNext(context)}
    </div>
    ${renderDiscard(context)}`;
}
