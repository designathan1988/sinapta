// The peeked page's own actions in the peek's bar, as Notion's: comment
// on it, copy its link, and the favorite star.
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPage, togglePageFavorite } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { linkToPage } from "../../ui/address/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { COMMENT_COMPOSER_OVERLAY } from "../comments/index.ts";
import { writeSystemClipboard } from "../editor/index.ts";

const TEXT = COPY.peek;

interface Action {
  readonly label: string;
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly isPressed?: boolean;
}

function renderAction(action: Action): TemplateResult {
  return html`<button
    type="button"
    class="button peek__button peek__action"
    data-variant="quiet"
    aria-label=${action.label}
    aria-pressed=${action.isPressed === undefined ? nothing : String(action.isPressed)}
    title=${tooltipTitle(action.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${action.onClick}
  >
    ${renderIcon(action.icon)}
  </button>`;
}

export function renderPeekActions(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId,
): TemplateResult {
  const isFavorite = selectPage(state, pageId)?.props.isFavorite === true;
  const overlay = { kind: COMMENT_COMPOSER_OVERLAY, anchorId: pageId };
  return html`${renderAction({
    label: TEXT.comment,
    icon: "comment",
    onClick: () => dispatch(openOverlay.create({ overlay })),
  })}
  ${renderAction({
    label: TEXT.copyLink,
    icon: "link",
    onClick: () => {
      writeSystemClipboard(linkToPage(pageId));
      announce(COPY.shell.linkCopied);
    },
  })}
  ${renderAction({
    label: TEXT.favorite,
    icon: "star",
    isPressed: isFavorite,
    onClick: () => dispatch(togglePageFavorite.create({ pageId })),
  })}`;
}
