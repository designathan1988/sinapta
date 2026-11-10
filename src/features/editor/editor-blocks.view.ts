import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { blockDefinition } from "../../blocks/block-registry.ts";
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import type { Block, BlockId } from "../../model/index.ts";
import { setSelection } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { appendParagraph } from "./editor-structure.commands.ts";
import { caretAt } from "./editor.commands.ts";
import {
  onBeforeInput,
  reconcileText,
  type InputContext,
} from "./editor-input.view.ts";
import { onBlockKeyDown } from "./editor-keys.view.ts";
import { selectBlockOrder, selectChildBlocks } from "./editor.selectors.ts";

function renderBlock(block: Block, context: InputContext): TemplateResult {
  const content = blockDefinition(block.type)?.render?.(
    block,
    context.dispatch,
  );
  const children = selectChildBlocks(context.state, block.id);
  return html`<div
    class="editor__block"
    data-block-id=${block.id}
    data-type=${block.type}
  >
    ${content ?? nothing}
    ${
      children.length === 0
        ? nothing
        : html`<div class="editor__children">
            ${renderList(children, context)}
          </div>`
    }
  </div>`;
}

function renderList(blocks: readonly Block[], context: InputContext): unknown {
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

// The content of a page: its blocks, with input handled once for all of
// them on the container.
export function renderBlocks(
  pageId: BlockId,
  context: InputContext,
): TemplateResult {
  const blocks = selectChildBlocks(context.state, pageId);
  const onCompositionEnd = (event: Event): void => {
    setComposing(event, false);
    reconcileText(event.target, context);
  };
  const onInput = (event: Event): void => {
    if (event instanceof InputEvent && !event.isComposing) {
      reconcileText(event.target, context);
    }
  };
  return html`<div
      class="editor__blocks"
      @beforeinput=${(event: InputEvent) => {
        onBeforeInput(event, context);
      }}
      @keydown=${(event: KeyboardEvent) => {
        onBlockKeyDown(event, context);
      }}
      @compositionstart=${(event: Event) => {
        setComposing(event, true);
      }}
      @compositionend=${onCompositionEnd}
      @input=${onInput}
    >
      ${renderList(blocks, context)}
    </div>
    ${renderContinue(pageId, blocks.length === 0, context)}`;
}
