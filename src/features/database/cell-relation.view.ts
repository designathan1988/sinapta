// The related pages of a relation cell in a popover.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  parseBlockId,
  type BlockId,
  type PropertyId,
} from "../../model/index.ts";
import { readPeople, renderPersonEditor } from "./properties/person/index.ts";
import { setRowValue } from "./row.commands.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import {
  readRelation,
  renderRelationEditor,
  selectRelationChoices,
  setRelationValue,
} from "./properties/relation/index.ts";
import type { TableContext } from "./table-cell.view.ts";

interface PersonCell {
  readonly rowId: BlockId;
  readonly propertyId: PropertyId;
  readonly stored: Readonly<Record<string, unknown>> | undefined;
}

// A Person cell's people: the workspace's, or this person alone with no
// server (ADR-0013).
function renderPeoplePicker(context: TableContext, cell: PersonCell) {
  const { state, dispatch } = context;
  const { user } = state.persistence.account;
  const members = state.persistence.sync.members;
  const everyone =
    members.length > 0 || user === null
      ? members
      : [{ id: user.id, name: user.name }];
  return renderPersonEditor({
    selected: readPeople(cell.stored?.[cell.propertyId]) ?? [],
    choices: everyone.map((person) => ({ id: person.id, name: person.name })),
    label: COPY.database.people,
    empty: COPY.database.noPeople,
    onChange: (people) =>
      dispatch(
        setRowValue.create({
          rowId: cell.rowId,
          propertyId: cell.propertyId,
          value: people.length === 0 ? undefined : people,
        }),
      ),
  });
}

// The row and property the open popover belongs to.
function cellOf(context: TableContext) {
  const { model, state } = context;
  const anchorId = state.ui.overlay?.anchorId ?? "";
  const [row = "", propertyKey = ""] = anchorId.split(":");
  const rowId = parseBlockId(row);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (rowId === undefined || property === undefined) return undefined;
  const stored = model.rows.find((item) => item.id === rowId)?.values;
  return { rowId, property, stored };
}

function renderEditorOf(
  context: TableContext,
  cell: NonNullable<ReturnType<typeof cellOf>>,
): TemplateResult {
  const { rowId, property, stored } = cell;
  const propertyId = property.id;
  if (property.type === "person") {
    return renderPeoplePicker(context, { rowId, propertyId, stored });
  }
  return renderRelationEditor({
    selected: readRelation(stored?.[propertyId]) ?? [],
    choices: selectRelationChoices(context.state, property),
    onChange: (ids) => {
      const value = ids.flatMap((id) => parseBlockId(id) ?? []);
      context.dispatch(setRelationValue.create({ rowId, propertyId, value }));
    },
  });
}

export function renderCellRelation(
  context: TableContext,
): TemplateResult | typeof nothing {
  const cell = cellOf(context);
  if (cell === undefined) return nothing;
  const close = (): void => {
    focusOverlayAnchor();
    context.dispatch(closeOverlay.create({}));
  };
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    aria-label=${COPY.database.relatedPages}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderEditorOf(context, cell)}
  </div>`;
}
