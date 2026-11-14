// The gallery's "Your templates": the pages saved with "Save as template",
// listed after the built-in ones, previewed with their text, and used as
// a copy at the top level.
import { html, nothing, type TemplateResult } from "lit-html";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  isPageLike,
  selectPageCopySize,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { useOwnTemplate } from "./own-template.commands.ts";

const TEXT = COPY.templates;

export function selectOwnTemplates(state: AppState): PageBlock[] {
  return Object.values(state.workspace.blocks).flatMap((block) =>
    isPageLike(block) &&
    block.props.isTemplate === true &&
    !block.props.isTrashed
      ? [block]
      : [],
  );
}

function titleOf(page: PageBlock): string {
  return selectPageTitle(page) || COPY.sidebar.untitled;
}

interface OwnPlace {
  readonly first: number;
  readonly activeIndex: number;
  readonly choose: (index: number) => void;
}

export function renderOwnItems(
  own: readonly PageBlock[],
  place: OwnPlace,
): TemplateResult | typeof nothing {
  if (own.length === 0) return nothing;
  return html`<section class="template-gallery__group">
    <h3 class="template-gallery__group-name">${TEXT.yours}</h3>
    <ul class="template-gallery__items">
      ${own.map((page, offset) => {
        const index = place.first + offset;
        return html`<li>
          <button
            type="button"
            class="template-gallery__item"
            data-index=${index}
            aria-pressed=${String(index === place.activeIndex)}
            @click=${() => {
              place.choose(index);
            }}
          >
            <span class="template-gallery__item-icon" aria-hidden="true"
              >${page.props.icon ?? renderIcon("page")}</span
            >
            <span class="template-gallery__item-text">
              <span class="template-gallery__item-name">${titleOf(page)}</span>
              <span class="template-gallery__item-description"
                >${TEXT.yoursDescription}</span
              >
            </span>
          </button>
        </li>`;
      })}
    </ul>
  </section>`;
}

export function renderOwnPreview(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const lines = page.childIds.flatMap((id) => {
    const block = state.workspace.blocks[id];
    return isTextBlock(block) ? [textOf(block)] : [];
  });
  const use = (): void => {
    const size = selectPageCopySize(state, page.id);
    dispatch(useOwnTemplate.create({ pageId: page.id, ...size }));
  };
  return html`<section
    class="template-gallery__preview"
    aria-label=${TEXT.preview}
  >
    <div class="template-gallery__actions">
      ${renderButton({ label: TEXT.use, variant: "primary", onClick: use })}
    </div>
    <div class="template-gallery__page">
      <p class="template-gallery__icon" aria-hidden="true">
        ${page.props.icon ?? renderIcon("page")}
      </p>
      <h3 class="template-gallery__title">${titleOf(page)}</h3>
      ${lines.map(
        (line) => html`<p class="template-gallery__block">${line}</p>`,
      )}
    </div>
  </section>`;
}
