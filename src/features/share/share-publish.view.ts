// The Publish tab: put the page on the web, then its address, View site
// and Unpublish (ADR-0013).
import { html, type TemplateResult } from "lit-html";
import {
  requestSync,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

const TEXT = COPY.share;

// The address anyone opens a published page at.
export function publicAddress(workspaceId: string, pageId: string): string {
  return `${location.origin}/p/${workspaceId}/${pageId}`;
}

function renderLive(address: string, unpublish: () => void): TemplateResult {
  return html`<input
      class="share__field"
      readonly
      .value=${address}
      aria-label=${TEXT.published}
    />
    <div class="share__actions">
      <button type="button" class="share__secondary" @click=${unpublish}>
        ${TEXT.unpublish}
      </button>
      <button
        type="button"
        class="share__primary"
        @click=${() => window.open(address, "_blank", "noopener")}
      >
        ${TEXT.viewSite}
      </button>
    </div>`;
}

export function renderPublishTab(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const pageId = state.ui.activePageId ?? "";
  const { sharing, workspaceId } = state.persistence.sync;
  const isPublished = sharing?.published === true;
  const publish = (published: boolean) => () =>
    dispatch(
      requestSync.create({ request: { kind: "publish", pageId, published } }),
    );
  const address = publicAddress(workspaceId ?? "", pageId);
  return html`<div class="share__body share__publish">
    <p class="share__title">
      ${isPublished ? TEXT.published : TEXT.publishTitle}
    </p>
    <p class="share__muted">${TEXT.publishSubtitle}</p>
    ${
      isPublished
        ? renderLive(address, publish(false))
        : html`<button
            type="button"
            class="share__primary share__wide"
            @click=${publish(true)}
          >
            ${TEXT.publish}
          </button>`
    }
    <p class="share__note">${TEXT.publishNote}</p>
  </div>`;
}
