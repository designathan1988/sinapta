import "./settings.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Theme } from "../../model/index.ts";
import {
  closeOverlay,
  requestExport,
  requestImport,
  selectTheme,
  setTheme,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";

export const SETTINGS_OVERLAY = SETTINGS_OVERLAY_KIND;

const THEME_OPTIONS: readonly { value: Theme; label: string }[] = [
  { value: "system", label: COPY.settings.themeSystem },
  { value: "light", label: COPY.settings.themeLight },
  { value: "dark", label: COPY.settings.themeDark },
];

function isTheme(value: string): value is Theme {
  return THEME_OPTIONS.some((option) => option.value === value);
}

function renderThemeField(current: Theme, dispatch: Dispatch): TemplateResult {
  const onChange = (event: Event): void => {
    const { target } = event;
    if (target instanceof HTMLInputElement && isTheme(target.value)) {
      dispatch(setTheme.create({ theme: target.value }));
    }
  };
  return html`<fieldset class="settings__field" @change=${onChange}>
    <legend class="settings__legend">${COPY.settings.themeLegend}</legend>
    ${THEME_OPTIONS.map(
      (option) =>
        html`<label class="settings__option">
          <input
            type="radio"
            name="theme"
            value=${option.value}
            .checked=${option.value === current}
          />
          ${option.label}
        </label>`,
    )}
  </fieldset>`;
}

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
      ${COPY.settings.importErrors[importError]}
    </p>`;
  }
  if (skippedCount === 0) return nothing;
  return html`<p class="settings__message" role="status">
    ${String(skippedCount)} ${COPY.settings.skipped}
  </p>`;
}

function renderDataField(state: AppState, dispatch: Dispatch): TemplateResult {
  return html`<fieldset class="settings__field" data-stacked>
    <legend class="settings__legend">${COPY.settings.dataLegend}</legend>
    <div class="settings__actions">
      ${renderButton({
        label: COPY.settings.export,
        onClick: () => dispatch(requestExport.create({})),
      })}
      <label class="button settings__file" data-variant="quiet">
        ${COPY.settings.import}
        <input
          class="visually-hidden"
          type="file"
          accept="application/json,.json"
          aria-describedby="settings-import-hint"
          @change=${(event: Event) => {
            onFileChosen(event, dispatch);
          }}
        />
      </label>
    </div>
    <p class="settings__hint" id="settings-import-hint">
      ${COPY.settings.importHint}
    </p>
    ${renderMessages(state)}
  </fieldset>`;
}

export function renderSettings(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderDialog({
    title: COPY.settings.title,
    closeLabel: COPY.settings.close,
    content: html`${renderThemeField(selectTheme(state), dispatch)}
    ${renderDataField(state, dispatch)}`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
