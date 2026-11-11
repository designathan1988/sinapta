// The value to give every ticked row for one property: an option, a
// checked or unchecked box, or typed text, as the property's type takes it.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { propertyType } from "./property-registry.ts";
import { setRowValues } from "./row-bulk.commands.ts";
import { selectTickedRows } from "./row-selection.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

export const BULK_EDIT_OVERLAY = "bulk-edit";

function choices(
  property: PropertyDefinition,
  set: (value: unknown) => void,
): MenuItem[] {
  if (propertyType(property.type).editor === "toggle") {
    return [
      {
        label: COPY.database.checked,
        onSelect: () => {
          set(true);
        },
      },
      {
        label: COPY.database.unchecked,
        onSelect: () => {
          set(undefined);
        },
      },
    ];
  }
  const isMany = property.type === "multi-select";
  const options = (property.options ?? []).map((option) => ({
    label: option.name,
    onSelect: () => {
      set(isMany ? [option.id] : option.id);
    },
  }));
  return [
    ...options,
    {
      label: COPY.database.clear,
      onSelect: () => {
        set(undefined);
      },
    },
  ];
}

interface Editing {
  readonly set: (value: unknown) => void;
  readonly close: () => void;
}

function renderTextEditor(
  property: PropertyDefinition,
  editing: Editing,
): TemplateResult {
  const { set, close } = editing;
  const type = propertyType(property.type);
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    <label class="database__view-name">
      ${property.name}
      <input
        class="database__field"
        type=${type.input?.type ?? "text"}
        inputmode=${type.input?.mode ?? nothing}
        data-autofocus
        @change=${(event: Event) => {
          if (event.target instanceof HTMLInputElement)
            set(type.parse(event.target.value));
        }}
      />
    </label>
  </div>`;
}

export function renderBulkEdit(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const property = model.database.props.properties.find(
    (item) => item.id === state.ui.overlay?.anchorId,
  );
  if (property === undefined) return nothing;
  const rowIds = selectTickedRows(state, model);
  const close = (): void => {
    dispatch(closeOverlay.create({}));
  };
  const set = (value: unknown): void => {
    dispatch(setRowValues.create({ rowIds, propertyId: property.id, value }));
    close();
  };
  const type = propertyType(property.type);
  if (type.editor === "options" || type.editor === "toggle") {
    const items = choices(property, set);
    return renderMenu({ label: property.name, items, onClose: close });
  }
  return renderTextEditor(property, { set, close });
}
