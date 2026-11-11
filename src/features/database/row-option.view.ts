// A select property's value on a row's own page: its option, chosen
// from the property's options drawn as chips, or none.
import type { TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { propertyType } from "./property-registry.ts";
import type { RowPage } from "./row-files.view.ts";
import { selectRowValues } from "./row-values.selectors.ts";
import { setRowValue } from "./row.commands.ts";

const NO_OPTION = "none";

// A select property's option, chosen from its options drawn as chips.
export function renderOptionChoice(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const chosen = propertyType(property.type).read(
    selectRowValues(row, [property])[property.id],
  );
  const options = property.options ?? [];
  const choose = (value: string): void => {
    const option = options.find((item) => item.id === value);
    page.dispatch(
      setRowValue.create({
        rowId: row.id,
        propertyId: property.id,
        value: option?.id,
      }),
    );
  };
  return renderSelect(
    {
      id: `row-${row.id}-${property.id}`,
      label: property.name,
      value: typeof chosen === "string" ? chosen : undefined,
      placeholder: COPY.database.emptyValue,
      options: [
        { value: NO_OPTION, label: COPY.database.noGrouping },
        ...options.map((option) => ({
          value: option.id,
          label: option.name,
          color: option.color,
        })),
      ],
      variant: "quiet",
      onChoose: choose,
    },
    { overlay: page.state.ui.overlay, dispatch: page.dispatch },
  );
}
