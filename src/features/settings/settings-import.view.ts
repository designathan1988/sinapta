// "Import workspace": a row whose button chooses a workspace file, and
// what came of the last import.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  requestImport,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderRow } from "./settings-row.view.ts";

const TEXT = COPY.settings;

// Reads the chosen file as text and hands it on; the persistence layer
// decides whether it is a workspace.
function onFileChosen(event: Event, dispatch: Dispatch): void {
  const input = event.target;
  const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
  if (file === undefined || !(input instanceof HTMLInputElement)) return;
  void file.text().then((text) => {
    input.value = "";
    dispatch(requestImport.create({ text }));
  });
}

function renderMessages(state: AppState): TemplateResult | typeof nothing {
  const { importError, skippedCount } = state.persistence;
  if (importError !== null) {
    return html`<p class="settings__message" role="alert" data-error>
      ${TEXT.importErrors[importError]}
    </p>`;
  }
  if (skippedCount === 0) return nothing;
  return html`<p class="settings__message" role="status">
    ${String(skippedCount)} ${TEXT.skipped}
  </p>`;
}

export function renderImportRow(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const chooser = html`<label
    class="button settings__file"
    data-variant="quiet"
  >
    ${TEXT.importButton}
    <input
      class="visually-hidden"
      type="file"
      accept="application/json,.json"
      aria-label=${TEXT.import}
      @change=${(event: Event) => {
        onFileChosen(event, dispatch);
      }}
    />
  </label>`;
  return html`${renderRow(TEXT.import, TEXT.importHint, chooser)}
  ${renderMessages(state)}`;
}
