// A feed, as Notion's: a column of posts, one per row, each with its icon
// and title, which open the row, and the first blocks of its page.
import { openRow } from "../../row-open.commands.ts";
import "./feed.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { DEFAULT_FEED_OPTIONS } from "../../feed-options.commands.ts";
import { propertyType } from "../../property-registry.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { selectFeed, type FeedBlock, type FeedPost } from "./feed.selectors.ts";

function renderBlock(block: FeedBlock): TemplateResult {
  return html`<p
    class="feed__block"
    data-type=${block.type}
    data-level=${block.level ?? nothing}
    ?data-checked=${block.isChecked === true}
  >
    ${block.text}
  </p>`;
}

// The values of the view's visible properties, on a row under the title.
function renderValues(post: FeedPost, context: TableContext) {
  const cell = selectCellContext(context.state);
  const values = context.model.columns.flatMap((column) => {
    if (column.isTitle) return [];
    const type = propertyType(column.property.type);
    const value = type.read(post.row.values[column.property.id]);
    if (value === undefined || value === false) return [];
    const shown = type.renderCell(value, column.property, cell);
    return [
      html`<span class="feed__value" title=${column.property.name}
        >${shown}</span
      >`,
    ];
  });
  return values.length === 0
    ? nothing
    : html`<div class="feed__values">${values}</div>`;
}

function renderPost(post: FeedPost, context: TableContext): TemplateResult {
  const { row } = post;
  const open = (): void => {
    context.dispatch(
      openRow.create({ rowId: row.id, viewId: context.model.view.id }),
    );
  };
  return html`<article class="feed__post" data-row-id=${row.id}>
    <button type="button" class="feed__title" @click=${open}>
      ${post.icon === null ? nothing : html`<span class="feed__icon">${post.icon}</span>`}
      ${row.title === "" ? COPY.sidebar.untitled : row.title}
    </button>
    ${renderValues(post, context)}
    ${
      post.blocks.length === 0
        ? html`<p class="feed__empty">${COPY.database.feedEmpty}</p>`
        : post.blocks.map(renderBlock)
    }
  </article>`;
}

export function renderFeed(context: TableContext): TemplateResult {
  const posts = selectFeed(context.state, context.model);
  const { wrapProperties } = context.model.view.feed ?? DEFAULT_FEED_OPTIONS;
  return html`<div class="feed" ?data-wrap=${wrapProperties}>
    ${posts.map((post) => renderPost(post, context))}
  </div>`;
}
