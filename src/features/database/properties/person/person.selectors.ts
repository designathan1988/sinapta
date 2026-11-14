import type { AppState } from "../../../../state/index.ts";
import type { PersonValue } from "./person.definition.ts";

// The people a Person value is chosen from: the workspace's, or this
// person alone with no server (ADR-0013).
export function selectPeopleChoices(state: AppState): PersonValue[] {
  const { user } = state.persistence.account;
  const members = state.persistence.sync.members;
  const everyone =
    members.length > 0 || user === null
      ? members
      : [{ id: user.id, name: user.name }];
  return everyone.map((person) => ({ id: person.id, name: person.name }));
}
