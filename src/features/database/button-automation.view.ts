// "Edit automation" of a button property, as Notion's: a dialog titled
// with the button's name; When "The button is clicked", a line down to
// Do, its actions in order and "New action" with the list of actions;
// and Save, which keeps the draft as the property's config.
import "./button-automation.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  closeOverlay,
  openChildOverlay,
  setOverlayDraft,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";
import { renderActionCard, type Card } from "./button-action-cards.view.ts";
import {
  ACTION_KINDS,
  BUTTON_AUTOMATION_OVERLAY,
  draftOf,
  newAction,
  NEW_ACTION_LIST,
} from "./button-automation.ts";
import { setPropertyConfig } from "./database.commands.ts";
import type { ButtonPropertyConfig } from "./properties/button/index.ts";
import type { TableContext } from "./table-cell.view.ts";

const TEXT = COPY.automation;

function renderNewAction(
  context: TableContext,
  draft: ButtonPropertyConfig,
): TemplateResult {
  const { state, dispatch, model } = context;
  const isOpen = childIndexOf(state.ui.overlay, NEW_ACTION_LIST) !== -1;
  const add = (kind: (typeof ACTION_KINDS)[number]) => (): void => {
    const action = newAction(kind, model.database.id);
    const next = { ...draft, actions: [...draft.actions, action] };
    dispatch(closeChildOverlay.create({ depth: 0 }));
    dispatch(setOverlayDraft.create({ draft: next }));
  };
  return html`<button
      type="button"
      class="automation__box automation__new"
      data-overlay-child-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      @click=${() => {
        dispatch(openChildOverlay.create({ anchorId: NEW_ACTION_LIST }));
      }}
    >
      ${renderIcon("plus")}<span>${TEXT.newAction}</span>
    </button>
    ${
      isOpen
        ? renderMenu({
            label: TEXT.newAction,
            isChild: true,
            items: ACTION_KINDS.map((kind) => ({
              label: TEXT.actions[kind],
              keepsOpen: true,
              onSelect: add(kind),
            })),
            context: { overlay: state.ui.overlay, dispatch },
            onClose: () => dispatch(closeChildOverlay.create({ depth: 0 })),
          })
        : nothing
    }`;
}

// Save keeps the draft as the button's config and closes the dialog.
function saveDraft(
  context: TableContext,
  draft: ButtonPropertyConfig,
  propertyId: string,
): void {
  const { dispatch, model } = context;
  const property = model.database.props.properties.find(
    (each) => each.id === propertyId,
  );
  if (property !== undefined) {
    dispatch(
      setPropertyConfig.create({
        databaseId: model.database.id,
        propertyId: property.id,
        config: draft,
      }),
    );
  }
  dispatch(closeOverlay.create({}));
}

// "When: Button is clicked", Button in bold, and the line down to Do.
function renderWhen(): TemplateResult {
  const rest = TEXT.clicked.slice(TEXT.clickedBold.length);
  return html`<p class="automation__label">${TEXT.when}</p>
    <div class="automation__box">
      ${renderIcon("button")}<span><b>${TEXT.clickedBold}</b>${rest}</span>
    </div>
    <span class="automation__line" aria-hidden="true"></span>`;
}

function renderContent(
  context: TableContext,
  draft: ButtonPropertyConfig,
  propertyId: string,
): TemplateResult {
  const { state, dispatch, model } = context;
  const card = (index: number): Card => ({
    state,
    dispatch,
    draft,
    index,
    database: model.database,
  });
  const save = (): void => {
    saveDraft(context, draft, propertyId);
  };
  return html`<div class="automation">
    ${renderWhen()}
    <p class="automation__label">${TEXT.do}</p>
    ${draft.actions.map((_, index) => renderActionCard(card(index)))}
    ${renderNewAction(context, draft)}
    <button
      type="button"
      class="button automation__save"
      data-variant="primary"
      @click=${save}
    >
      ${TEXT.save}
    </button>
  </div>`;
}

export function renderButtonAutomation(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { state, dispatch, model } = context;
  const { overlay } = state.ui;
  const draft = draftOf(overlay);
  const propertyId = overlay?.anchorId ?? "";
  const property = model.database.props.properties.find(
    (each) => each.id === propertyId,
  );
  if (draft === undefined || property === undefined) return nothing;
  return renderDialog({
    title: property.name,
    closeLabel: TEXT.close,
    variant: "form",
    content: renderContent(context, draft, propertyId),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export { BUTTON_AUTOMATION_OVERLAY };
