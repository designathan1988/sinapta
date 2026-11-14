// What a local server cannot run, drawn as Notion draws it and saying so
// (specification §1, ADR-0013): Notion's app connections, such as Slack
// and Google Drive.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";

const APPS = COPY.thirdParty;

function renderApp(name: string): TemplateResult {
  return html`<li class="settings__row">
    <span class="settings__text">
      <span class="settings__name">${name}</span>
      <span class="settings__hint">${APPS.unavailable}</span>
    </span>
    <button type="button" class="button" data-variant="outline" disabled>
      ${APPS.connect}
    </button>
  </li>`;
}

// Connections' "Connect apps": Notion's own connections, which cannot be
// turned on here.
export function renderThirdPartyApps(): TemplateResult {
  return html`<h4 class="settings__subtitle">${APPS.title}</h4>
    <p class="settings__hint">${APPS.lead}</p>
    <ul class="integrations__apps" role="list">
      ${APPS.apps.map(renderApp)}
    </ul>`;
}
