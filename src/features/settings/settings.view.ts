// Settings, as Notion's: a large dialog with its sections listed at the
// start and the open one beside them, each a title over rows of a name,
// a line that says what it does, and a control at the row's end.
import "./settings.css";
import { html, type TemplateResult } from "lit-html";
import type { Theme } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  requestExport,
  selectTheme,
  setTheme,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";
import { renderImportRow } from "./settings-import.view.ts";
import { renderRow } from "./settings-row.view.ts";

export const SETTINGS_OVERLAY = SETTINGS_OVERLAY_KIND;

const TEXT = COPY.settings;

type Section = keyof typeof TEXT.sections;

const SECTIONS: readonly { id: Section; icon: IconName }[] = [
  { id: "preferences", icon: "settings" },
  { id: "data", icon: "download" },
];

const THEMES: readonly { value: Theme; label: string }[] = [
  { value: "system", label: TEXT.themeSystem },
  { value: "light", label: TEXT.themeLight },
  { value: "dark", label: TEXT.themeDark },
];

function isTheme(value: string): value is Theme {
  return THEMES.some((option) => option.value === value);
}

function sectionOf(state: AppState): Section {
  return state.ui.overlay?.anchorId === "data" ? "data" : "preferences";
}

function renderSections(current: Section, dispatch: Dispatch): TemplateResult {
  const open = (anchorId: Section) => () =>
    dispatch(
      openOverlay.create({ overlay: { kind: SETTINGS_OVERLAY, anchorId } }),
    );
  return html`<nav class="settings__nav" aria-label=${TEXT.sectionsLabel}>
    <p class="settings__group">${TEXT.groupLabel}</p>
    ${SECTIONS.map(
      (section) =>
        html`<button
          type="button"
          class="settings__section"
          aria-current=${section.id === current ? "page" : "false"}
          @click=${open(section.id)}
        >
          ${renderIcon(section.icon)}
          <span>${TEXT.sections[section.id]}</span>
        </button>`,
    )}
  </nav>`;
}

function renderPreferences(state: AppState, dispatch: Dispatch) {
  const select = renderSelect(
    {
      id: "settings-theme",
      label: TEXT.appearance,
      value: selectTheme(state),
      options: THEMES,
      variant: "quiet",
      onChoose: (value) => {
        if (isTheme(value)) dispatch(setTheme.create({ theme: value }));
      },
    },
    { overlay: state.ui.overlay, dispatch },
  );
  return renderRow(TEXT.appearance, TEXT.appearanceHint, select);
}

function renderData(state: AppState, dispatch: Dispatch) {
  const exportButton = renderButton({
    label: TEXT.exportButton,
    onClick: () => dispatch(requestExport.create({})),
  });
  return html`${renderRow(TEXT.export, TEXT.exportHint, exportButton)}
  ${renderImportRow(state, dispatch)}`;
}

export function renderSettings(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const section = sectionOf(state);
  const content = html`<div class="settings">
    ${renderSections(section, dispatch)}
    <section class="settings__panel" aria-labelledby="settings-title">
      <h3 class="settings__title" id="settings-title">
        ${TEXT.sections[section]}
      </h3>
      ${
        section === "data"
          ? renderData(state, dispatch)
          : renderPreferences(state, dispatch)
      }
    </section>
  </div>`;
  return renderDialog({
    title: TEXT.title,
    closeLabel: TEXT.close,
    variant: "settings",
    content,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
