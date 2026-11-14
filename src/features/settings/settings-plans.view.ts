// Settings › Plans, as Notion's: a card for each plan with what it allows,
// the workspace's own marked "Current plan", and Upgrade or Downgrade on
// the others. A paid plan is charged to the workspace's card for each
// member (Settings › Billing); only the workspace's owners may choose.
import "./settings-plans.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { PLAN_LIMITS, PLANS, type PlanId } from "../../model/index.ts";
import {
  openOverlay,
  requestSync,
  selectWorkspacePlan,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";

const TEXT = COPY.plans;
const MB = 1024 * 1024;

interface PlanCard {
  readonly plan: PlanId;
  readonly current: PlanId;
  readonly canChange: boolean;
}

function renderAction(card: PlanCard, dispatch: Dispatch): TemplateResult {
  const { plan, current, canChange } = card;
  if (plan === current) {
    return html`<button
      type="button"
      class="button"
      data-variant="outline"
      disabled
    >
      ${TEXT.current}
    </button>`;
  }
  const isUp = PLANS.indexOf(plan) > PLANS.indexOf(current);
  return html`<button
    type="button"
    class="button"
    data-variant=${isUp ? "primary" : "outline"}
    ?disabled=${!canChange}
    @click=${() =>
      dispatch(requestSync.create({ request: { kind: "plan", plan } }))}
  >
    ${isUp ? TEXT.upgrade : TEXT.downgrade}
  </button>`;
}

function renderCard(card: PlanCard, dispatch: Dispatch): TemplateResult {
  const limits = PLAN_LIMITS[card.plan];
  return html`<li
    class="settings-plans__card"
    ?data-current=${card.plan === card.current}
  >
    <h4 class="settings-plans__name">${TEXT.names[card.plan]}</h4>
    <p class="settings-plans__price">${TEXT.prices[card.plan]}</p>
    <p class="settings__hint">${TEXT.summaries[card.plan]}</p>
    <ul class="settings-plans__limits">
      <li>${TEXT.upload(Math.round(limits.uploadBytes / MB))}</li>
      <li>${TEXT.history(limits.historyDays)}</li>
    </ul>
    ${renderAction(card, dispatch)}
  </li>`;
}

// Why the last upgrade did not go through, and the way to Billing.
function renderRefusal(state: AppState, dispatch: Dispatch) {
  const error = state.persistence.sync.billing?.error ?? null;
  if (error === null) return nothing;
  const overlay = { kind: SETTINGS_OVERLAY_KIND, anchorId: "billing" };
  return html`<p class="settings__message" data-error role="alert">
      ${COPY.billing.errors[error]}
    </p>
    ${renderButton({
      label: COPY.billing.title,
      icon: "card",
      onClick: () => dispatch(openOverlay.create({ overlay })),
    })}`;
}

export function renderPlans(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const current = selectWorkspacePlan(state);
  if (current === undefined) {
    return html`<p class="settings__hint">${TEXT.signedOut}</p>`;
  }
  const { workspaces, workspaceId } = state.persistence.sync;
  const role = workspaces.find((each) => each.id === workspaceId)?.role;
  const canChange = role === "owner";
  return html`<p class="settings__hint">${TEXT.lead}</p>
    ${canChange ? "" : html`<p class="settings__hint">${TEXT.ownersOnly}</p>`}
    ${renderRefusal(state, dispatch)}
    <ul class="settings-plans" role="list">
      ${PLANS.map((plan) => renderCard({ plan, current, canChange }, dispatch))}
    </ul>`;
}
