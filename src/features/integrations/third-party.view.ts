// Connections' "Connect apps", as Notion's list (n108-connections): each
// app with what connecting it does here, and Connect or Disconnect. An app
// that reaches an address (a channel's webhook, a calendar) asks for it in
// a disclosure under its row (ADR-0014).
import { html, nothing, type TemplateResult } from "lit-html";
import { APP_SPECS, needsAddress, type AppSpec } from "../../model/index.ts";
import {
  requestSync,
  type AppState,
  type ConnectedApp,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

const TEXT = COPY.thirdParty;

function ask(dispatch: Dispatch, app: string, address?: string): void {
  const request = {
    kind: "connect-app" as const,
    app,
    ...(address === undefined ? {} : { address }),
  };
  dispatch(requestSync.create({ request }));
}

function renderAddressForm(spec: AppSpec, dispatch: Dispatch): TemplateResult {
  const label =
    spec.kind === "webhook"
      ? TEXT.addressLabel.webhook
      : TEXT.addressLabel.calendar;
  return html`<details class="integrations__connect">
    <summary class="button" data-variant="outline">${TEXT.connect}</summary>
    <form
      class="integrations__address"
      @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        if (!(event.currentTarget instanceof HTMLFormElement)) return;
        const value = new FormData(event.currentTarget).get("address");
        if (typeof value === "string") ask(dispatch, spec.id, value.trim());
      }}
    >
      <input
        class="settings__field"
        name="address"
        type="url"
        pattern="https://.*"
        required
        aria-label=${label}
        placeholder=${TEXT.addressPlaceholder}
      />
      <button type="submit" class="button" data-variant="primary">
        ${TEXT.connect}
      </button>
    </form>
  </details>`;
}

function renderControl(
  spec: AppSpec,
  connected: ConnectedApp | undefined,
  dispatch: Dispatch,
): TemplateResult {
  if (connected !== undefined) {
    const request = { kind: "disconnect-app" as const, app: spec.id };
    return html`<button
      type="button"
      class="button"
      data-variant="outline"
      @click=${() => dispatch(requestSync.create({ request }))}
    >
      ${TEXT.disconnect}
    </button>`;
  }
  if (needsAddress(spec)) return renderAddressForm(spec, dispatch);
  return html`<button
    type="button"
    class="button"
    data-variant="outline"
    @click=${() => {
      ask(dispatch, spec.id);
    }}
  >
    ${TEXT.connect}
  </button>`;
}

function renderApp(
  spec: AppSpec,
  connected: ConnectedApp | undefined,
  dispatch: Dispatch,
): TemplateResult {
  const status =
    connected === undefined
      ? nothing
      : html`<span class="integrations__status"
          >${TEXT.connected}${
            connected.host === null ? "" : ` · ${connected.host}`
          }</span
        >`;
  return html`<li class="settings__row" data-app=${spec.id}>
    <span class="settings__text">
      <span class="settings__name">${spec.name} ${status}</span>
      <span class="settings__hint">${TEXT.kinds[spec.kind]}</span>
    </span>
    ${renderControl(spec, connected, dispatch)}
  </li>`;
}

export function renderThirdPartyApps(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const isSignedIn = state.persistence.sync.workspaceId !== null;
  const { apps } = state.persistence.sync;
  return html`<h4 class="settings__subtitle">${TEXT.title}</h4>
    <p class="settings__hint">${isSignedIn ? TEXT.lead : TEXT.signedOut}</p>
    ${
      isSignedIn
        ? html`<ul class="integrations__apps" role="list">
            ${APP_SPECS.map((spec) =>
              renderApp(
                spec,
                apps.find((each) => each.app === spec.id),
                dispatch,
              ),
            )}
          </ul>`
        : nothing
    }`;
}
