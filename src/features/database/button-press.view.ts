// A press on a row's button, from its cell or the row's page: with a Show
// confirmation action it asks first, as Notion's, then runs the actions,
// and an Open page that names a web address opens it in a new tab.
import type { TemplateResult } from "lit-html";
import { nothing } from "lit-html";
import {
  parseBlockId,
  parsePropertyId,
  safeWebAddress,
  type BlockId,
  type PropertyId,
} from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderConfirm } from "../../ui/confirm/index.ts";
import { buttonPress, selectButtonConfig } from "./button-press.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

const TEXT = COPY.automation;

export const BUTTON_CONFIRM_OVERLAY = "button-confirm";

export interface ButtonTarget {
  readonly rowId: BlockId;
  readonly propertyId: PropertyId;
}

function run(state: AppState, dispatch: Dispatch, target: ButtonTarget): void {
  const config = selectButtonConfig(state, target.rowId, target.propertyId);
  dispatch(buttonPress(state, target.rowId, target.propertyId));
  const open = config?.actions.find((action) => action.kind === "open-page");
  const url =
    open?.kind === "open-page" && open.url !== undefined
      ? safeWebAddress(open.url)
      : undefined;
  if (url !== undefined) window.open(url, "_blank", "noopener");
}

export function pressButton(
  state: AppState,
  dispatch: Dispatch,
  target: ButtonTarget,
): void {
  const config = selectButtonConfig(state, target.rowId, target.propertyId);
  const asks = config?.actions.some((action) => action.kind === "confirm");
  if (asks !== true) {
    run(state, dispatch, target);
    return;
  }
  const anchorId = `${target.rowId}:${target.propertyId}`;
  dispatch(
    openOverlay.create({ overlay: { kind: BUTTON_CONFIRM_OVERLAY, anchorId } }),
  );
}

function targetOf(anchorId: string): ButtonTarget | undefined {
  const [row = "", property = ""] = anchorId.split(":");
  const rowId = parseBlockId(row);
  const propertyId = parsePropertyId(property);
  return rowId === undefined || propertyId === undefined
    ? undefined
    : { rowId, propertyId };
}

// The question of the button whose press is the overlay's anchor.
export function renderButtonConfirm(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { state, dispatch } = context;
  const target = targetOf(state.ui.overlay?.anchorId ?? "");
  if (target === undefined) return nothing;
  const { rowId, propertyId } = target;
  const config = selectButtonConfig(state, rowId, propertyId);
  const confirm = config?.actions.find((action) => action.kind === "confirm");
  if (confirm?.kind !== "confirm") return nothing;
  return renderConfirm({
    question: confirm.message === "" ? TEXT.confirmDefault : confirm.message,
    answer: TEXT.confirmGo,
    cancel: TEXT.confirmCancel,
    onAnswer: () => {
      run(state, dispatch, { rowId, propertyId });
    },
    onCancel: () => dispatch(closeOverlay.create({})),
  });
}
