// Notion's verified badge in the top bar: a check and "Verified", with who
// verified the page in its name (ADR-0013).
import { html, nothing, type TemplateResult } from "lit-html";
import { isPageLike } from "../../blocks/page/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";

export function renderVerifiedBadge(
  state: AppState,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  const page = pageId === null ? undefined : state.workspace.blocks[pageId];
  if (page === undefined || !isPageLike(page)) return nothing;
  const verification = page.props.verification;
  if (verification === undefined) return nothing;
  const label = `${COPY.verify.verifiedBy} ${verification.by}`;
  return html`<span
    class="page-menu__verified"
    title=${label}
    aria-label=${label}
    >${renderIcon("check")} ${COPY.database.verified}</span
  >`;
}
