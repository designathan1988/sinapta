// The row peek, as Notion's: the row's page beside the database (side) or
// over it (center), under a bar that closes it, opens it as a full page,
// switches where rows open and steps to the previous or next row.
import "./peek.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { keyed } from "lit-html/directives/keyed.js";
import { ref } from "lit-html/directives/ref.js";
import { selectPage } from "../../blocks/page/index.ts";
import type { BlockId, View } from "../../model/index.ts";
import type { AppState, Command, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderEditor } from "../editor/index.ts";
import { renderPageMenuButton } from "../page-menu/index.ts";
import {
  closePeek,
  expandPeek,
  setPeekMode,
  stepPeek,
} from "./peek.commands.ts";
import { selectPeekPlace } from "./peek.selectors.ts";
import { renderPeekActions } from "./peek-actions.view.ts";
import { renderPeekResizer } from "./peek-resizer.view.ts";

const TEXT = COPY.peek;

const MODE_ICONS: Readonly<Record<View["openMode"], IconName>> = {
  side: "peek-side",
  center: "peek-center",
  full: "peek-full",
};

interface BarButton {
  readonly label: string;
  readonly icon: IconName;
  readonly command: Command;
  readonly isDisabled?: boolean;
}

function renderBarButton(button: BarButton, dispatch: Dispatch) {
  const isDisabled = button.isDisabled === true;
  return html`<button
    type="button"
    class="button peek__button"
    data-variant="quiet"
    aria-label=${button.label}
    aria-disabled=${isDisabled ? "true" : nothing}
    title=${tooltipTitle(button.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => {
      if (!isDisabled) dispatch(button.command);
    }}
  >
    ${renderIcon(button.icon)}
  </button>`;
}

function renderModeSwitch(state: AppState, dispatch: Dispatch) {
  const mode = state.ui.peek?.mode ?? "side";
  const modes = ["side", "center", "full"] as const;
  return renderSelect(
    {
      id: "peek-mode",
      label: TEXT.mode,
      value: mode,
      variant: "icon",
      display: renderIcon(MODE_ICONS[mode]),
      options: modes.map((value) => ({
        value,
        label: TEXT.modes[value],
        icon: MODE_ICONS[value],
      })),
      onChoose: (value) => {
        const chosen = modes.find((item) => item === value);
        if (chosen !== undefined) {
          dispatch(setPeekMode.create({ mode: chosen }));
        }
      },
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

function renderBar(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId,
): TemplateResult {
  const place = selectPeekPlace(state);
  const button = (item: BarButton) => renderBarButton(item, dispatch);
  return html`<div class="peek__bar">
    ${button({ label: TEXT.close, icon: "peek-close", command: closePeek.create({}) })}
    ${button({ label: TEXT.expand, icon: "expand", command: expandPeek.create({}) })}
    <span class="peek__gap"></span>
    ${renderModeSwitch(state, dispatch)}
    <span class="peek__gap"></span>
    ${button({
      label: TEXT.previous,
      icon: "up",
      command: stepPeek.create({ by: -1 }),
      isDisabled: !place.hasPrevious,
    })}
    ${button({
      label: TEXT.next,
      icon: "down",
      command: stepPeek.create({ by: 1 }),
      isDisabled: !place.hasNext,
    })}
    <span class="peek__end">
      ${renderPeekActions(state, dispatch, pageId)}
      ${renderPageMenuButton({ place: "peek", pageId, state, dispatch })}
    </span>
  </div>`;
}

// A field that keeps the keys it is typed with. The page's title gives
// Escape up: it has no block for Escape to select, so Escape closes the
// peek from it, as Notion's.
function isEditing(event: KeyboardEvent): boolean {
  const { target } = event;
  if (!(target instanceof HTMLElement)) return false;
  if (event.key === "Escape" && target.matches(".editor__title")) return false;
  return target.isContentEditable || target.matches("input, textarea");
}

// Escape closes the peek, and K and J step through the rows, unless a
// field or a menu has the keys.
function onKeyDown(event: KeyboardEvent, state: AppState, dispatch: Dispatch) {
  if (state.ui.overlay !== null || isEditing(event)) return;
  const commands: Partial<Record<string, Command>> = {
    Escape: closePeek.create({}),
    k: stepPeek.create({ by: -1 }),
    j: stepPeek.create({ by: 1 }),
  };
  const command = commands[event.key];
  if (command === undefined || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  dispatch(command);
}

// The row the peek shows, or a control inside it, takes the focus back
// when the peek closes, as a dialog gives it back to what opened it.
function focusRow(rowId: BlockId): void {
  const row = document.querySelector<HTMLElement>(
    `[data-row-id="${CSS.escape(rowId)}"]`,
  );
  const control = row?.matches("button, a, [tabindex]")
    ? row
    : row?.querySelector<HTMLElement>("button, a, [tabindex]");
  control?.focus();
}

function closingTo(rowId: BlockId, dispatch: Dispatch): Dispatch {
  return (command) => {
    const result = dispatch(command);
    if (command.type === closePeek.type) focusRow(rowId);
    return result;
  };
}

export function renderPeek(
  state: AppState,
  outer: Dispatch,
): TemplateResult | typeof nothing {
  const { peek } = state.ui;
  const page = selectPage(state, peek?.pageId ?? null);
  if (peek === null || page === undefined || page.props.isTrashed) {
    return nothing;
  }
  const dispatch = closingTo(page.id, outer);
  const panel = html`<aside
    class="peek"
    data-mode=${peek.mode}
    aria-label=${TEXT.label}
    tabindex="-1"
    ${ref(focusOnce)}
    @keydown=${(event: KeyboardEvent) => {
      onKeyDown(event, state, dispatch);
    }}
  >
    ${peek.mode === "side" ? renderPeekResizer(state, outer) : nothing}
    ${renderBar(state, dispatch, page.id)}
    <div class="peek__body">
      ${keyed(page.id, renderEditor(state, dispatch, page.id))}
    </div>
  </aside>`;
  if (peek.mode === "side") return panel;
  return html`<div
      class="peek-scrim"
      @click=${() => dispatch(closePeek.create({}))}
    ></div>
    ${panel}`;
}
