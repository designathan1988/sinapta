import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { blockDefinition, isTextBlock, textOf } from "../../blocks/index.ts";
import { isBlockColor, type Block, type BlockId } from "../../model/index.ts";
import { setSelection } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { appendParagraph } from "./editor-structure.commands.ts";
import {
  renderAddButton,
  renderHandle,
  startBlockDrag,
} from "./editor-block-menu.view.ts";
import { onBlockContextMenu } from "./editor-context-menu.view.ts";
import { renderStartList } from "./editor-start.view.ts";
import { caretAt } from "./editor.commands.ts";
import {
  onBeforeInput,
  reconcileText,
  type InputContext,
} from "./editor-input.view.ts";
import { onBlockKeyDown } from "./editor-keys.view.ts";
import {
  onSelectionCopy,
  onSelectionLeave,
  startPointerSelection,
} from "./editor-selection.view.ts";
import {
  selectBlockOrder,
  selectContentBlocks,
  selectSelectedBlocks,
} from "./editor.selectors.ts";

interface BlockContext extends InputContext {
  // Ids of the blocks in the block selection.
  readonly selected: ReadonlySet<BlockId>;
}

function renderChildren(block: Block, context: BlockContext): unknown {
  // A closed toggle keeps its children but does not show them.
  const isOpen = blockDefinition(block.type)?.showsChildren?.(block) ?? true;
  const children = isOpen ? selectContentBlocks(context.state, block.id) : [];
  if (children.length === 0) return nothing;
  return html`<div class="editor__children">
    ${renderList(children, context)}
  </div>`;
}

function renderBlock(block: Block, context: BlockContext): TemplateResult {
  const { state, dispatch } = context;
  const content = blockDefinition(block.type)?.render?.(block, dispatch, state);
  const isAnchor = state.ui.overlay?.anchorId === block.id;
  return html`<div
    class="editor__block"
    data-block-id=${block.id}
    data-type=${block.type}
    data-color=${isBlockColor(block.props.color) ? block.props.color : nothing}
    data-overlay-anchor=${isAnchor ? "open" : nothing}
    ?data-selected=${context.selected.has(block.id)}
  >
    ${renderAddButton(block, context)} ${renderHandle(block, context)}
    ${content ?? nothing} ${renderChildren(block, context)}
  </div>`;
}

function renderList(blocks: readonly Block[], context: BlockContext): unknown {
  return repeat(
    blocks,
    (block) => block.id,
    (block) => renderBlock(block, context),
  );
}

// While the browser composes text inside a block, projection must not
// touch that block; the attribute tells it so.
function setComposing(event: Event, isComposing: boolean): void {
  const text =
    event.target instanceof Element
      ? event.target.closest("[data-text]")
      : null;
  text?.toggleAttribute("data-composing", isComposing);
}

// Puts the caret in the last block, or in a new paragraph after it.
export function continueWriting(pageId: BlockId, context: InputContext): void {
  const last = selectBlockOrder(context.state, pageId).at(-1);
  if (isTextBlock(last) && textOf(last) === "") {
    context.dispatch(setSelection.create({ selection: caretAt(last.id, 0) }));
  } else {
    context.dispatch(appendParagraph.create({ pageId }));
  }
}

function renderContinue(
  pageId: BlockId,
  isEmpty: boolean,
  context: InputContext,
): TemplateResult {
  return html`<button
    type="button"
    class="editor__continue"
    ?data-empty=${isEmpty}
    @click=${() => {
      continueWriting(pageId, context);
    }}
  >
    ${COPY.editor.continueWriting}
  </button>`;
}

function onPointerDown(event: PointerEvent, context: InputContext): void {
  onSelectionLeave(event, context);
  startPointerSelection(event, context);
  startBlockDrag(event, context);
}

function onCompositionEnd(event: Event, context: InputContext): void {
  setComposing(event, false);
  reconcileText(event.target, context);
}

function onInput(event: Event, context: InputContext): void {
  if (event instanceof InputEvent && !event.isComposing) {
    reconcileText(event.target, context);
  }
}

// The content of a page: its blocks, with input handled once for all of
// them on the container.
export function renderBlocks(
  pageId: BlockId,
  context: InputContext,
): TemplateResult {
  const blocks = selectContentBlocks(context.state, pageId);
  const selected = new Set(
    selectSelectedBlocks(context.state).map((block) => block.id),
  );
  const on =
    <TEvent>(handler: (event: TEvent, context: InputContext) => void) =>
    (event: TEvent): void => {
      handler(event, context);
    };
  return html`<div
      class="editor__blocks"
      tabindex="-1"
      @copy=${on(onSelectionCopy)}
      @cut=${on(onSelectionCopy)}
      @focusout=${on(onSelectionLeave)}
      @beforeinput=${on(onBeforeInput)}
      @keydown=${on(onBlockKeyDown)}
      @pointerdown=${on(onPointerDown)}
      @contextmenu=${(event: Event) => {
        onBlockContextMenu(event, context.dispatch);
      }}
      @compositionstart=${(event: Event) => {
        setComposing(event, true);
      }}
      @compositionend=${on(onCompositionEnd)}
      @input=${on(onInput)}
    >
      ${renderList(blocks, { ...context, selected })}
    </div>
    ${renderContinue(pageId, blocks.length === 0, context)}
    ${renderStartList(pageId, context)}`;
}
