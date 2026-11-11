// A toolbar over selected text: marks, link and color. It is shown while
// a range of one text block is selected, so it holds no state of its own.
import "./format-toolbar.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Mark } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { afterRender } from "../../ui/focus/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { openLinkField, toggleTextMark } from "../editor/index.ts";
import {
  selectFormatRange,
  selectRangeStyle,
  TONE_OVERLAY,
  TOOLBAR_MARKS,
  type FormatRange,
} from "./format-toolbar.selectors.ts";

const MARK_GLYPHS: Record<Mark, string> = {
  bold: "B",
  italic: "I",
  underline: "U",
  strikethrough: "S",
  code: "</>",
};

// Pressing a toolbar button must not move the caret out of the text, or
// the selection it formats would be lost.
function keepSelection(event: Event): void {
  event.preventDefault();
}

// Places the toolbar above the selected text. It runs after the render has
// finished and the caret is restored, so measuring the selection reads no
// layout during the render.
function placeToolbar(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  afterRender(() => {
    if (!element.isConnected) return;
    if (!element.matches(":popover-open")) element.showPopover();
    const selection = document.getSelection();
    const anchor = selection?.anchorNode?.parentElement;
    if (selection === null || selection.rangeCount === 0) return;
    if (anchor?.closest("[data-text]") == null) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    element.style.setProperty("--format-toolbar-x", `${String(x)}px`);
    element.style.setProperty("--format-toolbar-y", `${String(rect.top)}px`);
  });
}

interface ButtonSpec {
  readonly label: string;
  readonly glyph: string;
  readonly isPressed: boolean;
  readonly onPress: () => void;
  readonly mark?: Mark;
}

function renderToolButton(spec: ButtonSpec): TemplateResult {
  return html`<button
    type="button"
    class="format-toolbar__button"
    data-mark=${spec.mark ?? nothing}
    aria-label=${spec.label}
    aria-pressed=${String(spec.isPressed)}
    title=${tooltipTitle(spec.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${spec.onPress}
  >
    ${spec.glyph}
  </button>`;
}

function renderColorButton(
  state: AppState,
  range: FormatRange,
  dispatch: Dispatch,
): TemplateResult {
  const isOpen = state.ui.overlay?.kind === TONE_OVERLAY;
  const overlay = { kind: TONE_OVERLAY, anchorId: range.blockId, ...range };
  const onClick = (): void => {
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<button
    type="button"
    class="format-toolbar__button"
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(isOpen)}
    @click=${onClick}
  >
    <span class="format-toolbar__swatch" aria-hidden="true">A</span>
    ${COPY.formatToolbar.color}
  </button>`;
}

function renderLinkButton(
  range: FormatRange,
  hasLink: boolean,
  dispatch: Dispatch,
): TemplateResult {
  const selection = {
    blockId: range.blockId,
    anchorOffset: range.start,
    focusOffset: range.end,
  };
  return renderToolButton({
    label: COPY.formatToolbar.link,
    glyph: COPY.formatToolbar.link,
    isPressed: hasLink,
    onPress: () => openLinkField(selection, dispatch),
  });
}

export function renderFormatToolbar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const range = selectFormatRange(state);
  if (range === undefined) return nothing;
  const style = selectRangeStyle(state, range);
  const markButton = (mark: Mark): TemplateResult =>
    renderToolButton({
      label: COPY.formatToolbar[mark],
      glyph: MARK_GLYPHS[mark],
      mark,
      isPressed: style.marks.includes(mark),
      onPress: () => dispatch(toggleTextMark.create({ ...range, mark })),
    });
  return html`<div
    class="format-toolbar"
    role="toolbar"
    aria-label=${COPY.formatToolbar.label}
    popover="manual"
    data-format-toolbar
    ${ref((element) => {
      placeToolbar(element);
    })}
    @pointerdown=${keepSelection}
  >
    ${TOOLBAR_MARKS.map(markButton)}
    ${renderLinkButton(range, style.hasLink, dispatch)}
    ${renderColorButton(state, range, dispatch)}
  </div>`;
}
