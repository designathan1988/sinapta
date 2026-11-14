// Settings › Connections, as Notion's (ADR-0013): make an internal
// integration and copy its secret once, see the pages connected to each,
// and remove one.
import { renderThirdPartyApps } from "./third-party.view.ts";
import "./integrations.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  requestSync,
  type AppState,
  type Dispatch,
  type IntegrationSummary,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { writeSystemClipboard } from "../editor/index.ts";

const TEXT = COPY.integration;

function onCreate(event: SubmitEvent, dispatch: Dispatch): void {
  event.preventDefault();
  if (!(event.currentTarget instanceof HTMLFormElement)) return;
  const name = new FormData(event.currentTarget).get("name");
  if (typeof name !== "string" || name.trim() === "") return;
  dispatch(
    requestSync.create({ request: { kind: "create-integration", name } }),
  );
  event.currentTarget.reset();
}

function renderForm(dispatch: Dispatch): TemplateResult {
  return html`<form
    class="integrations__form"
    @submit=${(event: SubmitEvent) => {
      onCreate(event, dispatch);
    }}
  >
    <input
      class="integrations__field"
      name="name"
      required
      autocomplete="off"
      aria-label=${TEXT.nameLabel}
      placeholder=${TEXT.namePlaceholder}
    />
    <button class="button" data-variant="primary">${TEXT.create}</button>
  </form>`;
}

function renderSecret(state: AppState): TemplateResult | typeof nothing {
  const made = state.persistence.sync.newSecret;
  if (made === null) return nothing;
  return html`<div class="integrations__secret" role="status">
    <p class="integrations__secret-title">${TEXT.secretTitle} · ${made.name}</p>
    <p class="settings__hint">${TEXT.secretHint}</p>
    <div class="integrations__secret-row">
      <code class="integrations__code">${made.secret}</code>
      <button
        type="button"
        class="button"
        @click=${() => {
          writeSystemClipboard(made.secret);
          announce(TEXT.copied);
        }}
      >
        ${TEXT.copy}
      </button>
    </div>
  </div>`;
}

function renderRow(each: IntegrationSummary, dispatch: Dispatch) {
  return html`<tr>
    <td>${each.name}</td>
    <td>${String(each.pageIds.length)}</td>
    <td>
      <button
        type="button"
        class="integrations__remove"
        @click=${() =>
          dispatch(
            requestSync.create({
              request: { kind: "remove-integration", integrationId: each.id },
            }),
          )}
      >
        ${TEXT.remove}
      </button>
    </td>
  </tr>`;
}

export function renderConnections(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  if (state.persistence.account.user === null) {
    return html`<p class="settings__hint">${TEXT.signedOut}</p>
      ${renderThirdPartyApps(state, dispatch)}`;
  }
  const { integrations } = state.persistence.sync;
  return html`<p class="settings__hint">${TEXT.lead}</p>
    ${renderForm(dispatch)} ${renderSecret(state)}
    <table class="integrations__table">
      <thead>
        <tr>
          <th>${TEXT.columnName}</th>
          <th>${TEXT.columnPages}</th>
          <th><span class="visually-hidden">${TEXT.remove}</span></th>
        </tr>
      </thead>
      <tbody>
        ${
          integrations.length === 0
            ? html`<tr>
                <td class="integrations__none" colspan="3">${TEXT.none}</td>
              </tr>`
            : integrations.map((each) => renderRow(each, dispatch))
        }
      </tbody>
    </table>
    ${renderThirdPartyApps(state, dispatch)}`;
}
