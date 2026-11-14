// Notion's Share menu (n85-share-tab): a Share tab to invite people with
// their access and set who else can open the page, and a Publish tab that
// puts the page on the web (ADR-0013).
import "./share.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  requestSync,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderPublishTab } from "./share-publish.view.ts";
import { renderShareTab } from "./share-tab.view.ts";

export const SHARE_OVERLAY = "share";

const TEXT = COPY.share;

// The "Share" button of the top bar, while signed in to a server.
export function renderShareButton(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  if (pageId === null || state.persistence.account.user === null) {
    return nothing;
  }
  const isOpen = state.ui.overlay?.kind === SHARE_OVERLAY;
  return html`<button
    type="button"
    class="share__button"
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(isOpen)}
    @click=${() => {
      if (isOpen) {
        dispatch(closeOverlay.create({}));
        return;
      }
      dispatch(openOverlay.create({ overlay: { kind: SHARE_OVERLAY } }));
      dispatch(requestSync.create({ request: { kind: "sharing", pageId } }));
    }}
  >
    ${TEXT.button}
  </button>`;
}

function renderTabs(isPublish: boolean, dispatch: Dispatch): TemplateResult {
  const tab = (panel: string | undefined, label: string, isOn: boolean) =>
    html`<button
      type="button"
      class="share__tab"
      role="tab"
      aria-selected=${String(isOn)}
      @click=${() =>
        dispatch(
          openOverlay.create({
            overlay: {
              kind: SHARE_OVERLAY,
              ...(panel === undefined ? {} : { panel }),
            },
          }),
        )}
    >
      ${label}
    </button>`;
  return html`<div class="share__tabs" role="tablist">
    ${tab(undefined, TEXT.tabShare, !isPublish)}
    ${tab("publish", TEXT.tabPublish, isPublish)}
    <span class="share__learn">${TEXT.learn}</span>
  </div>`;
}

export function renderSharePanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  if (pageId === null) return nothing;
  const isPublish = state.ui.overlay?.panel === "publish";
  return html`<div
    class="share"
    data-overlay
    popover="manual"
    role="dialog"
    aria-label=${TEXT.label}
    ${ref(showPopoverWhenConnected)}
  >
    ${renderTabs(isPublish, dispatch)}
    ${
      isPublish
        ? renderPublishTab(state, dispatch)
        : renderShareTab(state, dispatch)
    }
  </div>`;
}
