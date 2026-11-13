// A template's cadence, as Notion's: the strip's "Duplicate every…", which
// lists the eight cadences (Day to Year) and, once one is chosen or one is
// set, shows "Edit cadence" under it; and the same choices in the
// template's "…", which open the template with its cadence to edit.
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPage, type Repeat } from "../../blocks/page/index.ts";
import type { BlockId, ViewId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setOverlayValues,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuEntry } from "../../ui/menu/index.ts";
import {
  CADENCE_PRESETS,
  CADENCE_VALUES,
  presetDraft,
  readDraft,
  repeatDraft,
  writeDraft,
  type CadencePreset,
} from "./template-cadence.ts";
import { renderCadencePanel } from "./template-cadence.view.ts";
import { editTemplate } from "./template.commands.ts";

const TEXT = COPY.cadence;

export const TEMPLATE_REPEAT_OVERLAY = "template-repeat";

function todayOf(): string {
  return new Date().toLocaleDateString("en-CA");
}

// "Duplicate every week", "Duplicate every 2 weeks", or Off.
export function repeatSummary(repeat: Repeat | undefined): string {
  if (repeat === undefined) return COPY.database.repeatPeriods.off;
  const interval = repeat.interval ?? 1;
  return interval > 1
    ? TEXT.repeating(`${String(interval)} ${TEXT.unitsPlural[repeat.every]}`)
    : TEXT.repeating(TEXT.units[repeat.every]);
}

function openCadence(
  dispatch: Dispatch,
  templateId: BlockId,
  values: string[],
): void {
  const overlay = { kind: TEMPLATE_REPEAT_OVERLAY, anchorId: templateId };
  dispatch(openOverlay.create({ overlay }));
  dispatch(setOverlayValues.create({ name: CADENCE_VALUES, values }));
}

// The eight cadences; in the strip each starts a draft in place, in the
// template's "…" it opens the template with the draft.
export function presetChoices(
  dispatch: Dispatch,
  templateId: BlockId,
  viewId?: ViewId,
): MenuEntry[] {
  const choose = (preset: CadencePreset) => (): void => {
    const values = writeDraft(presetDraft(preset, todayOf()));
    if (viewId === undefined) {
      dispatch(setOverlayValues.create({ name: CADENCE_VALUES, values }));
      return;
    }
    dispatch(editTemplate.create({ templateId, viewId }));
    openCadence(dispatch, templateId, values);
  };
  return CADENCE_PRESETS.map((preset) => ({
    label: TEXT.presets[preset],
    keepsOpen: viewId === undefined,
    onSelect: choose(preset),
  }));
}

function renderOpen(
  state: AppState,
  dispatch: Dispatch,
  templateId: BlockId,
): TemplateResult {
  const { overlay } = state.ui;
  const draft = readDraft(overlay?.values?.[CADENCE_VALUES]);
  if (draft !== undefined) {
    const today = todayOf();
    return renderCadencePanel({ state, dispatch, templateId, draft, today });
  }
  return renderMenu({
    label: COPY.database.templateRepeat,
    items: presetChoices(dispatch, templateId),
    context: { overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

// Opens the eight cadences, or the cadence set to edit; or closes them.
function toggleRepeat(
  dispatch: Dispatch,
  at: { templateId: BlockId; isOpen: boolean; repeat: Repeat | undefined },
): void {
  const { templateId, isOpen, repeat } = at;
  if (isOpen) dispatch(closeOverlay.create({}));
  else if (repeat === undefined) {
    const next = { kind: TEMPLATE_REPEAT_OVERLAY, anchorId: templateId };
    dispatch(openOverlay.create({ overlay: next }));
  } else {
    const values = writeDraft(repeatDraft(repeat, todayOf()));
    openCadence(dispatch, templateId, values);
  }
}

// Repeat…, or the cadence set, and its list or panel while open.
export function renderRepeatButton(
  state: AppState,
  dispatch: Dispatch,
  templateId: BlockId,
): TemplateResult {
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === TEMPLATE_REPEAT_OVERLAY &&
    overlay.anchorId === templateId;
  const repeat = selectPage(state, templateId)?.props.repeat;
  const open = (): void => {
    toggleRepeat(dispatch, { templateId, isOpen, repeat });
  };
  return html`<button
      type="button"
      class="database__template-repeat"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isOpen)}
      @click=${open}
    >
      <span
        >${
          repeat === undefined
            ? COPY.database.templateRepeatButton
            : repeatSummary(repeat)
        }</span
      >${renderIcon("chevron")}
    </button>
    ${isOpen ? renderOpen(state, dispatch, templateId) : nothing}`;
}
