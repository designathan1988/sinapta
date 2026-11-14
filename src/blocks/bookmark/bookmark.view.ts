import "./bookmark.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import { setBookmarkUrl } from "./bookmark.commands.ts";
import { safeBookmarkUrl, type BookmarkBlock } from "./bookmark.schema.ts";

function hostOf(url: string): string {
  return URL.parse(url)?.hostname.replace(/^www\./, "") ?? url;
}

export function renderBookmark(
  block: BookmarkBlock,
  dispatch: Dispatch,
): TemplateResult {
  const { url } = block.props;
  const { blocks } = COPY;
  if (url === "") {
    return renderUrlField({
      label: blocks.bookmarkLabel,
      placeholder: blocks.bookmarkPlaceholder,
      submitLabel: blocks.bookmarkSubmit,
      invalidMessage: blocks.bookmarkInvalid,
      isValid: (value) => safeBookmarkUrl(value) !== undefined,
      onSubmit: (value) =>
        dispatch(setBookmarkUrl.create({ blockId: block.id, url: value })),
    });
  }
  return renderCard(url, block.props.preview);
}

// Notion's bookmark card: the page's title, its description and its
// address with the site's icon, the page's image at the end; until the
// server has read the page, its host and address.
function renderCard(
  url: string,
  preview: BookmarkBlock["props"]["preview"],
): TemplateResult {
  return html`<a
    class="bookmark"
    href=${url}
    target="_blank"
    rel="noreferrer noopener"
    ?data-preview=${preview !== undefined}
  >
    <span class="bookmark__text">
      <span class="bookmark__host">${preview?.title ?? hostOf(url)}</span>
      ${
        preview === undefined || preview.description === ""
          ? nothing
          : html`<span class="bookmark__description"
              >${preview.description}</span
            >`
      }
      <span class="bookmark__url">
        ${
          preview?.icon == null
            ? nothing
            : html`<img class="bookmark__icon" src=${preview.icon} alt="" />`
        }
        ${url}
      </span>
    </span>
    ${
      preview?.image == null
        ? nothing
        : html`<img class="bookmark__image" src=${preview.image} alt="" />`
    }
  </a>`;
}
