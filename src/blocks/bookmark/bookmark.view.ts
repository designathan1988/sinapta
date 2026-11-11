import "./bookmark.css";
import { html, type TemplateResult } from "lit-html";
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
  return html`<a
    class="bookmark"
    href=${url}
    target="_blank"
    rel="noreferrer noopener"
  >
    <span class="bookmark__host">${hostOf(url)}</span>
    <span class="bookmark__url">${url}</span>
  </a>`;
}
