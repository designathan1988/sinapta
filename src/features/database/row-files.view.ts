// The files and the related pages of a row, on the row's own page.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { parseBlockId } from "../../model/index.ts";
import { pressButton } from "./button-press.view.ts";
import { buttonLabel } from "./properties/button/index.ts";
import { readFiles, renderFilesEditor } from "./properties/files/index.ts";
import {
  readRelation,
  renderRelationEditor,
  selectRelationChoices,
  setRelationValue,
} from "./properties/relation/index.ts";
import {
  readPeople,
  renderPersonEditor,
  selectPeopleChoices,
} from "./properties/person/index.ts";
import { setRowValue } from "./row.commands.ts";
import { COPY } from "../../ui/copy.ts";

export interface RowPage {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

export function renderRowFiles(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const { dispatch } = page;
  const rowId = row.id;
  const propertyId = property.id;
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
  >
    <legend class="database__row-name">${property.name}</legend>
    ${renderFilesEditor({
      entries: readFiles(row.props.values?.[property.id]) ?? [],
      assetUrls: page.state.persistence.assetUrls,
      dispatch,
      onChange: (value) =>
        dispatch(setRowValue.create({ rowId, propertyId, value })),
    })}
  </fieldset>`;
}

export function renderRowButton(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const rowId = row.id;
  const propertyId = property.id;
  return html`<div
    class="database__row-property"
    data-property-id=${propertyId}
  >
    <span class="database__row-name">${property.name}</span>
    <button
      type="button"
      class="button-property"
      @click=${() => {
        pressButton(page.state, page.dispatch, { rowId, propertyId });
      }}
    >
      ${buttonLabel(property)}
    </button>
  </div>`;
}

// A Person property on the row's page: the workspace's people to pick.
function renderRowPeople(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const rowId = row.id;
  const propertyId = property.id;
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
  >
    <legend class="database__row-name">${property.name}</legend>
    ${renderPersonEditor({
      selected: readPeople(row.props.values?.[property.id]) ?? [],
      choices: selectPeopleChoices(page.state),
      label: COPY.database.people,
      empty: COPY.database.noPeople,
      onChange: (people) =>
        page.dispatch(
          setRowValue.create({
            rowId,
            propertyId,
            value: people.length === 0 ? undefined : people,
          }),
        ),
    })}
  </fieldset>`;
}

export function renderRowRelation(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const { dispatch, state } = page;
  const rowId = row.id;
  const propertyId = property.id;
  if (property.type === "person") return renderRowPeople(row, property, page);
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
  >
    <legend class="database__row-name">${property.name}</legend>
    ${renderRelationEditor({
      selected: readRelation(row.props.values?.[property.id]) ?? [],
      choices: selectRelationChoices(state, property),
      onChange: (ids) => {
        const value = ids.flatMap((id) => parseBlockId(id) ?? []);
        dispatch(setRelationValue.create({ rowId, propertyId, value }));
      },
    })}
  </fieldset>`;
}
