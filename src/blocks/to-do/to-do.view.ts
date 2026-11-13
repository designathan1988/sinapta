import { CHECKBOX_CLASS } from "../../ui/checkbox/index.ts";
import "./to-do.css";
import { html, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import { toggleToDo } from "./to-do.commands.ts";
import type { ToDoBlock } from "./to-do.schema.ts";

export function renderToDo(
  block: ToDoBlock,
  dispatch: Dispatch,
): TemplateResult {
  const { isChecked, text } = block.props;
  return html`<div class="to-do" ?data-checked=${isChecked}>
    <input
      class="to-do__check ${CHECKBOX_CLASS}"
      data-variant="todo"
      type="checkbox"
      aria-label=${COPY.blocks.toDoCheck}
      .checked=${isChecked}
      @change=${() => dispatch(toggleToDo.create({ blockId: block.id }))}
    />
    ${renderRichText({ text, tag: "div", placeholder: COPY.blocks.toDo })}
  </div>`;
}
