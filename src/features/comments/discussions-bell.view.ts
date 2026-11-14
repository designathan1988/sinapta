// The bell at the Discussions panel's head, as Notion's: it opens the
// page's notification settings, All comments or Replies and @mentions.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PageBlock } from "../../blocks/page/index.ts";
import {
  closeChildOverlay,
  openChildOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";
import { commentNoticeItems } from "./comment-notices.view.ts";

const BELL = "discussions-bell";
const TEXT = COPY.comments;

export function renderDiscussionsBell(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const isOpen = childIndexOf(state.ui.overlay, BELL) >= 0;
  const close = () => dispatch(closeChildOverlay.create({ depth: 0 }));
  return html`<button
      type="button"
      class="comments__bell"
      data-overlay-child-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      aria-label=${TEXT.notifySettings}
      title=${TEXT.notifySettings}
      @click=${() => {
        if (isOpen) close();
        else dispatch(openChildOverlay.create({ anchorId: BELL }));
      }}
    >
      ${renderIcon("bell")}
    </button>
    ${
      isOpen
        ? renderMenu({
            label: TEXT.notifySettings,
            items: [
              { kind: "section", label: TEXT.notifySettings },
              ...commentNoticeItems(state, page, dispatch),
            ],
            onClose: close,
            isChild: true,
          })
        : nothing
    }`;
}
