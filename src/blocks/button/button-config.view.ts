// The settings of a button: its label, the blocks it inserts (written as
// Markdown lines), the page it opens and the database it adds a row to.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import {
  DATABASE_TYPE,
  isPageLike,
  PAGE_LIKE_TYPES,
  selectIsInTrash,
  selectPageTitle,
} from "../page/index.ts";
import { setButtonActions, setButtonLabel } from "./button.commands.ts";
import {
  templatesFromMarkdown,
  templatesToMarkdown,
  withAction,
} from "./button-templates.ts";
import type { ButtonAction, ButtonBlock } from "./button.schema.ts";

interface Choice {
  readonly id: string;
  readonly title: string;
}

interface Select {
  readonly label: string;
  readonly options: readonly Choice[];
  readonly selected: string;
}

// The pages of the given types that are not in the trash.
function choices(state: AppState, types: readonly string[]): Choice[] {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (!types.includes(block.type) || !isPageLike(block)) return [];
    if (selectIsInTrash(state, block)) return [];
    const title = selectPageTitle(block);
    const shown = title === "" ? COPY.sidebar.untitled : title;
    return [{ id: block.id, title: shown }];
  });
}

function renderSelect(select: Select, onPick: (id: string) => void) {
  const onChange = (event: Event): void => {
    if (event.target instanceof HTMLSelectElement) onPick(event.target.value);
  };
  const { label, options, selected } = select;
  return html`<label class="button-block__field">
    ${label}
    <select @change=${onChange}>
      <option value="" ?selected=${selected === ""}>
        ${COPY.buttonBlock.none}
      </option>
      ${options.map(
        (option) =>
          html`<option value=${option.id} ?selected=${option.id === selected}>
            ${option.title}
          </option>`,
      )}
    </select>
  </label>`;
}

function insertField(actions: readonly ButtonAction[], dispatchSet: Setter) {
  const insert = actions.find((action) => action.kind === "insert-blocks");
  const markdown =
    insert?.kind === "insert-blocks" ? templatesToMarkdown(insert.blocks) : "";
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    const blocks = templatesFromMarkdown(event.target.value);
    const action: ButtonAction = { kind: "insert-blocks", blocks };
    dispatchSet("insert-blocks", blocks.length === 0 ? undefined : action);
  };
  return html`<label class="button-block__field">
    ${COPY.buttonBlock.insert}
    <textarea rows="4" .value=${markdown} @change=${onChange}></textarea>
  </label>`;
}

type Setter = (kind: ButtonAction["kind"], action?: ButtonAction) => void;

function pageFields(
  state: AppState,
  actions: readonly ButtonAction[],
  set: Setter,
) {
  const open = actions.find((action) => action.kind === "open-page");
  const row = actions.find((action) => action.kind === "add-row");
  const openPage = renderSelect(
    {
      label: COPY.buttonBlock.openPage,
      options: choices(state, PAGE_LIKE_TYPES),
      selected: open?.kind === "open-page" ? open.pageId : "",
    },
    (id) => {
      const pageId = parseBlockId(id);
      set(
        "open-page",
        pageId === undefined ? undefined : { kind: "open-page", pageId },
      );
    },
  );
  const addRow = renderSelect(
    {
      label: COPY.buttonBlock.addRow,
      options: choices(state, [DATABASE_TYPE]),
      selected: row?.kind === "add-row" ? row.databaseId : "",
    },
    (id) => {
      const databaseId = parseBlockId(id);
      const action: ButtonAction | undefined =
        databaseId === undefined
          ? undefined
          : { kind: "add-row", databaseId, values: {} };
      set("add-row", action);
    },
  );
  return html`${openPage}${addRow}`;
}

export function renderButtonConfig(
  block: ButtonBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const blockId = block.id;
  const { actions, label } = block.props;
  const set: Setter = (kind, action) => {
    const next = withAction(actions, kind, action);
    dispatch(setButtonActions.create({ blockId, actions: next }));
  };
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const onLabel = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    dispatch(setButtonLabel.create({ blockId, label: event.target.value }));
  };
  return html`<div
    class="button-block__config"
    popover="manual"
    data-overlay
    aria-label=${COPY.buttonBlock.settings}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    <label class="button-block__field">
      ${COPY.buttonBlock.label}
      <input type="text" data-autofocus .value=${label} @change=${onLabel} />
    </label>
    ${insertField(actions, set)} ${pageFields(state, actions, set)}
  </div>`;
}
