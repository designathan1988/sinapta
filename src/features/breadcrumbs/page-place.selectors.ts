// Where the open page lives, as Notion's top bar names it beside the
// title: a teamspace, the pages shared with people, or Private.
import { selectBreadcrumbs } from "../../blocks/page/index.ts";
import {
  selectTeamspaces,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export type PagePlace =
  | { readonly kind: "teamspace"; readonly teamspace: TeamspaceBlock }
  | { readonly kind: "shared" }
  | { readonly kind: "private" };

export function selectPagePlace(
  state: AppState,
  pageId: BlockId | null,
): PagePlace | undefined {
  const top = selectBreadcrumbs(state, pageId)[0];
  if (top === undefined) return undefined;
  const teamspace = selectTeamspaces(state).find(
    (each) => each.id === top.parentId,
  );
  if (teamspace !== undefined) return { kind: "teamspace", teamspace };
  return state.persistence.sync.shared.includes(top.id)
    ? { kind: "shared" }
    : { kind: "private" };
}
