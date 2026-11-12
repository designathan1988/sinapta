// The offer of a new version, as a small notice at the foot of the window:
// reload into it now, or later.
import "./update-prompt.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  applyUpdate,
  dismissUpdate,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { renderButton } from "../ui/button/index.ts";
import { COPY } from "../ui/copy.ts";

const TEXT = COPY.shell;

function renderActions(dispatch: Dispatch): TemplateResult {
  return html`${renderButton({
    label: TEXT.updateReload,
    variant: "primary",
    onClick: () => dispatch(applyUpdate.create({})),
  })}
  ${renderButton({
    label: TEXT.updateLater,
    onClick: () => dispatch(dismissUpdate.create({})),
  })}`;
}

export function renderUpdatePrompt(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { update } = state.ui;
  if (update === "none") return nothing;
  return html`<div class="update-prompt" role="status">
    <span class="update-prompt__text"
      >${update === "ready" ? TEXT.updateReady : TEXT.updating}</span
    >
    ${update === "ready" ? renderActions(dispatch) : nothing}
  </div>`;
}
