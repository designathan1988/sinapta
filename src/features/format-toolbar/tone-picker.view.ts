// The colors for selected text: a text color and a highlight, each from
// the eight tones of the chip palette, or none.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Tone } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { setTextTone } from "../editor/index.ts";
import {
  selectFormatRange,
  selectRangeStyle,
  TONE_OVERLAY,
  type FormatRange,
} from "./format-toolbar.selectors.ts";

const TONES: readonly Tone[] = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "red",
];

type ToneKey = "color" | "highlight";

interface GroupSpec {
  readonly key: ToneKey;
  readonly legend: string;
  readonly noneLabel: string;
  readonly current: Tone | undefined;
}

function renderSwatch(
  key: ToneKey,
  tone: Tone | null,
  isCurrent: boolean,
): TemplateResult {
  const label = tone === null ? "" : COPY.tones[tone];
  return html`<button
    type="button"
    class="format-toolbar__tone"
    data-key=${key}
    data-tone=${tone ?? "none"}
    aria-pressed=${String(isCurrent)}
    ?data-autofocus=${isCurrent && key === "color"}
  >
    <span
      class="format-toolbar__swatch"
      data-key=${key}
      data-tone=${tone ?? nothing}
      >A</span
    >
    <span>${label}</span>
  </button>`;
}

function renderGroup(spec: GroupSpec): TemplateResult {
  return html`<fieldset class="format-toolbar__tones">
    <legend>${spec.legend}</legend>
    <button
      type="button"
      class="format-toolbar__tone"
      data-key=${spec.key}
      data-tone="none"
      aria-pressed=${String(spec.current === undefined)}
      ?data-autofocus=${spec.key === "color" && spec.current === undefined}
    >
      ${spec.noneLabel}
    </button>
    ${TONES.map((tone) => renderSwatch(spec.key, tone, spec.current === tone))}
  </fieldset>`;
}

interface Pick {
  readonly key: ToneKey;
  readonly tone: Tone | null;
}

// The color button that was pressed, read from its data attributes.
function pickOf(event: Event): Pick | undefined {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest<HTMLElement>("button[data-tone][data-key]");
  const key = button?.dataset.key;
  if (button == null || (key !== "color" && key !== "highlight")) return;
  const tone = TONES.find((item) => item === button.dataset.tone) ?? null;
  return { key, tone };
}

function onPick(event: Event, range: FormatRange, dispatch: Dispatch): void {
  const pick = pickOf(event);
  if (pick === undefined) return;
  dispatch(setTextTone.create({ ...range, ...pick }));
  dispatch(closeOverlay.create({}));
}

// Escape closes the picker and puts focus back on its Color button.
function onPickerKey(event: KeyboardEvent, dispatch: Dispatch): void {
  if (event.key !== "Escape") return;
  focusOverlayAnchor();
  dispatch(closeOverlay.create({}));
}

export function renderTonePicker(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const range = selectFormatRange(state);
  if (state.ui.overlay?.kind !== TONE_OVERLAY || range === undefined)
    return nothing;
  const style = selectRangeStyle(state, range);
  const { formatToolbar } = COPY;
  return html`<div
    class="format-toolbar__picker"
    role="dialog"
    aria-label=${formatToolbar.color}
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @pointerdown=${(event: Event) => {
      event.preventDefault();
    }}
    @click=${(event: Event) => {
      onPick(event, range, dispatch);
    }}
    @keydown=${(event: KeyboardEvent) => {
      onPickerKey(event, dispatch);
    }}
  >
    ${renderGroup({
      key: "color",
      legend: formatToolbar.textColor,
      noneLabel: formatToolbar.defaultColor,
      current: style.color,
    })}
    ${renderGroup({
      key: "highlight",
      legend: formatToolbar.highlight,
      noneLabel: formatToolbar.noHighlight,
      current: style.highlight,
    })}
  </div>`;
}
