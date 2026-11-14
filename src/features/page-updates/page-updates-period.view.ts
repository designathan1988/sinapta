// The chip over the views chart that chooses how far back they are
// counted, and its menu, as Notion's: Last 7, 28 or 90 days, All time.
import { html, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  setViewsPeriod,
  type AppState,
  type Dispatch,
  type ViewsPeriod,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";

export const VIEWS_PERIOD_OVERLAY = "views-period";
const PERIODS: readonly ViewsPeriod[] = [7, 28, 90, "all"];
const TEXT = COPY.pageUpdates;

export function renderPeriodButton(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const period = state.ui.pageUpdates?.period ?? 28;
  const isOpen = state.ui.overlay?.kind === VIEWS_PERIOD_OVERLAY;
  const overlay = { kind: VIEWS_PERIOD_OVERLAY, anchorId: "views-period" };
  return html`<button
    type="button"
    class="page-updates__period"
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    data-overlay-anchor
    @click=${() =>
      dispatch(
        isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
      )}
  >
    ${renderIcon("calendar")} ${TEXT.periods[period]} ${renderIcon("chevron")}
  </button>`;
}

export function renderViewsPeriodMenu(
  _state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderMenu({
    label: TEXT.period,
    isNarrow: true,
    items: PERIODS.map((period) => ({
      label: TEXT.periods[period],
      onSelect: () => dispatch(setViewsPeriod.create({ period })),
    })),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
