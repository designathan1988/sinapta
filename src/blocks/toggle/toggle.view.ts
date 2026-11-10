import { html, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import { setToggleOpen } from "./toggle.commands.ts";
import type { ToggleBlock } from "./toggle.schema.ts";

export function renderToggle(
  block: ToggleBlock,
  dispatch: Dispatch,
): TemplateResult {
  const { isOpen, text } = block.props;
  const onClick = (): void => {
    dispatch(setToggleOpen.create({ blockId: block.id, isOpen: !isOpen }));
  };
  return html`<div class="toggle">
    <button
      type="button"
      class="toggle__button"
      aria-expanded=${String(isOpen)}
      aria-label=${isOpen ? COPY.blocks.toggleClose : COPY.blocks.toggleOpen}
      @click=${onClick}
    >
      ${renderIcon("chevron")}
    </button>
    ${renderRichText({ text, tag: "div", placeholder: COPY.blocks.toggle })}
  </div>`;
}
