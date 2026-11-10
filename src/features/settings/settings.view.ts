import "./settings.css";
import { html, type TemplateResult } from "lit-html";
import type { Theme } from "../../model/index.ts";
import {
  closeOverlay,
  selectTheme,
  setTheme,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
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

export function renderSettings(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderDialog({
    title: COPY.settings.title,
    closeLabel: COPY.settings.close,
    content: renderThemeField(selectTheme(state), dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
