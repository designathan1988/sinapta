// On a row's page, a property whose value has discussions shows, as
// Notion's, a speech bubble and their count just past its end; it opens
// them in a popover by the button.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  renderValueComments,
  selectValueDiscussionCount,
  VALUE_DISCUSSIONS_OVERLAY,
  valueAnchorId,
} from "../comments/index.ts";
import { valueTarget } from "./cell-actions.view.ts";
import type { RowPage } from "./row-files.view.ts";
import { selectAllRowValues } from "./row-values.selectors.ts";

export function renderRowValueComments(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult | typeof nothing {
  const { state, dispatch } = page;
  const count = selectValueDiscussionCount(state, row.id, property.id);
  if (count === 0) return nothing;
  const anchorId = valueAnchorId(row.id, property.id);
  const open = state.ui.overlay;
  const isOpen =
    open?.kind === VALUE_DISCUSSIONS_OVERLAY && open.anchorId === anchorId;
  const overlay = { kind: VALUE_DISCUSSIONS_OVERLAY, anchorId };
  const today = new Date().toLocaleDateString("en-CA");
  const values = selectAllRowValues({ state, today }, row, [property]);
  return html`<button
      type="button"
      class="database__row-comments"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isOpen)}
      aria-label=${`${String(count)} ${pluralize(count, COPY.comments.count)}`}
      @click=${() => {
        dispatch(
          isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
        );
      }}
    >
      ${renderIcon("comment")}<span>${count}</span>
    </button>
    ${
      isOpen
        ? renderValueComments(
            state,
            dispatch,
            valueTarget(row.id, values, property),
          )
        : nothing
    }`;
}
