// The pages a relation cell can hold: the rows of its related database
// that are not in the trash.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { selectDatabase } from "../../../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPage,
  selectPageTitle,
} from "../../../../blocks/page/index.ts";
import type { BlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import { readRelationConfig } from "./relation.schema.ts";

export interface RelationChoice {
  readonly id: BlockId;
  readonly title: string;
}

export function selectRelationChoices(
  state: AppState,
  property: PropertyDefinition,
): RelationChoice[] {
  const config = readRelationConfig(property.config);
  const database = selectDatabase(state, config?.databaseId ?? null);
  return (database?.childIds ?? []).flatMap((id) => {
    const page = selectPage(state, id);
    if (page === undefined || selectIsInTrash(state, page)) return [];
    return [{ id: page.id, title: selectPageTitle(page) }];
  });
}
