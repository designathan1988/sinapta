// A dialog that lists the keyboard shortcuts, grouped by where they work.
import "./shortcut-help.css";
import { html, type TemplateResult } from "lit-html";
import { closeOverlay, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import {
  keyLabel,
  SHORTCUT_GROUPS,
  type ShortcutEntry,
  type ShortcutGroup,
} from "./shortcut-help.selectors.ts";

function isMacLike(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

function renderEntry(entry: ShortcutEntry, isMac: boolean): TemplateResult {
  return html`<div class="shortcut-help__entry">
    <dt>${entry.label}</dt>
    <dd>
      ${entry.keys.map((key) => html`<kbd>${keyLabel(key, isMac)}</kbd>`)}
    </dd>
  </div>`;
}

function renderGroup(group: ShortcutGroup, isMac: boolean): TemplateResult {
  return html`<section class="shortcut-help__group">
    <h3 class="shortcut-help__title">${group.title}</h3>
    <dl class="shortcut-help__list">
      ${group.entries.map((entry) => renderEntry(entry, isMac))}
    </dl>
  </section>`;
}

export function renderShortcutHelp(dispatch: Dispatch): TemplateResult {
  const isMac = isMacLike();
  return renderDialog({
    title: COPY.shortcutHelp.title,
    closeLabel: COPY.shortcutHelp.close,
    content: html`<div class="shortcut-help">
      ${SHORTCUT_GROUPS.map((group) => renderGroup(group, isMac))}
    </div>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
