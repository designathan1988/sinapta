import "./heading.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderRichText, type RichTextTag } from "../../ui/rich-text/index.ts";
import { setHeadingOpen } from "./heading.commands.ts";
import type { HeadingBlock } from "./heading.schema.ts";

// The page title is the document's h1, so block headings start at h2.
const TAGS: Record<HeadingBlock["props"]["level"], RichTextTag> = {
  1: "h2",
  2: "h3",
  3: "h4",
  4: "h5",
};

// The arrow of a toggle heading, like a toggle block's.
function renderArrow(
  block: HeadingBlock,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (block.props.isToggleable !== true) return nothing;
  const isOpen = block.props.isOpen !== false;
  return html`<button
    type="button"
    class="heading__toggle"
    aria-expanded=${String(isOpen)}
    aria-label=${isOpen ? COPY.blocks.toggleClose : COPY.blocks.toggleOpen}
    @click=${() =>
      dispatch(setHeadingOpen.create({ blockId: block.id, isOpen: !isOpen }))}
  >
    ${renderIcon("chevron")}
  </button>`;
}

export function renderHeading(
  block: HeadingBlock,
  dispatch: Dispatch,
): TemplateResult {
  const { level, text } = block.props;
  return html`<div class="heading" data-level=${level}>
    ${renderArrow(block, dispatch)}
    ${renderRichText({
      text,
      tag: TAGS[level],
      placeholder: `${COPY.blocks.heading} ${String(level)}`,
    })}
  </div>`;
}
