// The rows of the selection panel, as Notion's: the block's type with a
// chevron that turns the block into another type; Color, Bold, Italic,
// Underline, Clear formatting; Link, Strikethrough, Code, Equation,
// More; and Comment. Each button names itself and its keys when pointed
// at.
import { html, nothing, type TemplateResult } from "lit-html";
import type { Block, Mark } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  COMMENT_COMPOSER_OVERLAY,
  REACTION_OVERLAY,
} from "../comments/index.ts";
import {
  BLOCK_MENU_OVERLAY,
  blockTypeName,
  clearTextFormat,
  makeInlineEquation,
  openLinkField,
  toggleTextMark,
  TURN_INTO_OVERLAY,
} from "../editor/index.ts";
import { headingLook, lookOf } from "../slash-menu/index.ts";
import { renderSuggestButton } from "./format-toolbar-suggest.view.ts";
import {
  TONE_OVERLAY,
  type FormatRange,
  type RangeStyle,
} from "./format-toolbar.selectors.ts";

const TEXT = COPY.formatToolbar;

const MARK_GLYPHS: Record<Mark, string> = {
  bold: "B",
  italic: "I",
  underline: "U",
  strikethrough: "S",
  code: "</>",
};

export interface PanelContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly range: FormatRange;
  readonly style: RangeStyle;
}

interface ButtonSpec {
  readonly label: string;
  readonly keys?: string;
  readonly glyph: TemplateResult | string;
  readonly onPress: () => void;
  readonly isPressed?: boolean;
  readonly mark?: Mark;
  readonly opensMenu?: boolean;
}

function renderButton(spec: ButtonSpec): TemplateResult {
  const hint =
    spec.keys === undefined ? spec.label : `${spec.label} ${spec.keys}`;
  return html`<button
    type="button"
    class="format-toolbar__button"
    data-mark=${spec.mark ?? nothing}
    aria-label=${spec.label}
    aria-keyshortcuts=${spec.keys ?? nothing}
    aria-pressed=${spec.isPressed === undefined ? nothing : String(spec.isPressed)}
    aria-haspopup=${spec.opensMenu === true ? "menu" : nothing}
    ?data-overlay-anchor=${spec.opensMenu === true}
    data-tooltip=${hint}
    title=${tooltipTitle(hint)}
    interestfor=${TOOLTIP_TARGET}
    @click=${spec.onPress}
  >
    ${spec.glyph}
  </button>`;
}

// The overlay a button opens over the selected text, which it keeps.
function open(context: PanelContext, kind: string) {
  return (): void => {
    const { range, dispatch, state } = context;
    if (state.ui.overlay?.kind === kind) {
      dispatch(closeOverlay.create({}));
      return;
    }
    const overlay = { kind, anchorId: range.blockId, ...range };
    dispatch(openOverlay.create({ overlay }));
  };
}

function typeIcon(block: Block): IconName {
  const level = block.props.level;
  if (block.type === "heading" && typeof level === "number") {
    return headingLook(level, false).icon;
  }
  return lookOf(block.type).icon;
}

export function renderTurnIntoRow(context: PanelContext): TemplateResult {
  const block = context.state.workspace.blocks[context.range.blockId];
  const name = block === undefined ? "" : blockTypeName(block);
  const isOpen = context.state.ui.overlay?.kind === TURN_INTO_OVERLAY;
  return html`<button
    type="button"
    class="format-toolbar__row"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${`${TEXT.turnInto}: ${name}`}
    @click=${open(context, TURN_INTO_OVERLAY)}
  >
    ${block === undefined ? nothing : renderIcon(typeIcon(block))}
    <span class="format-toolbar__row-label">${name}</span>
    ${renderIcon("chevron")}
  </button>`;
}

function markButton(context: PanelContext, mark: Mark): TemplateResult {
  const { range, dispatch, style } = context;
  return renderButton({
    label: TEXT[mark],
    keys: TEXT.keys[mark],
    glyph: MARK_GLYPHS[mark],
    mark,
    isPressed: style.marks.includes(mark),
    onPress: () => dispatch(toggleTextMark.create({ ...range, mark })),
  });
}

export function renderFirstRow(context: PanelContext): TemplateResult {
  const { range, dispatch } = context;
  const color = html`<span class="format-toolbar__swatch" aria-hidden="true"
    >A</span
  >`;
  return html`<div class="format-toolbar__tools" role="group">
    ${renderButton({
      label: TEXT.color,
      glyph: color,
      opensMenu: true,
      onPress: open(context, TONE_OVERLAY),
    })}
    ${markButton(context, "bold")} ${markButton(context, "italic")}
    ${markButton(context, "underline")}
    ${renderButton({
      label: TEXT.clearFormat,
      glyph: html`T<sub aria-hidden="true">x</sub>`,
      onPress: () => dispatch(clearTextFormat.create(range)),
    })}
  </div>`;
}

export function renderSecondRow(context: PanelContext): TemplateResult {
  const { range, dispatch, style } = context;
  const selection = {
    blockId: range.blockId,
    anchorOffset: range.start,
    focusOffset: range.end,
  };
  return html`<div class="format-toolbar__tools" role="group">
    ${renderButton({
      label: TEXT.link,
      keys: TEXT.keys.link,
      glyph: renderIcon("link"),
      isPressed: style.hasLink,
      onPress: () => openLinkField(selection, dispatch),
    })}
    ${markButton(context, "strikethrough")} ${markButton(context, "code")}
    ${renderButton({
      label: TEXT.equation,
      keys: TEXT.keys.equation,
      glyph: "√x",
      onPress: () => dispatch(makeInlineEquation.create(range)),
    })}
    ${renderButton({
      label: TEXT.more,
      glyph: renderIcon("more"),
      opensMenu: true,
      onPress: open(context, BLOCK_MENU_OVERLAY),
    })}
  </div>`;
}

// "Comment": a discussion on the selected text; beside it, as Notion's,
// "Add reaction", a discussion that is a reaction alone.
export function renderCommentRow(context: PanelContext): TemplateResult {
  const isReacting = context.state.ui.overlay?.kind === REACTION_OVERLAY;
  return html`<div class="format-toolbar__comment-row">
    <button
      type="button"
      class="format-toolbar__row"
      aria-keyshortcuts=${TEXT.keys.comment}
      data-tooltip=${`${TEXT.comment} ${TEXT.keys.comment}`}
      @click=${open(context, COMMENT_COMPOSER_OVERLAY)}
    >
      ${renderIcon("comment")}
      <span class="format-toolbar__row-label">${TEXT.comment}</span>
    </button>
    <button
      type="button"
      class="format-toolbar__button"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isReacting)}
      aria-label=${COPY.comments.addReaction}
      data-tooltip=${COPY.comments.addReaction}
      @click=${open(context, REACTION_OVERLAY)}
    >
      ${renderIcon("smile")}
    </button>
    ${renderSuggestButton(context)}
  </div>`;
}
