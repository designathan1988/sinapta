// The questions a form's sending left unanswered: interface state, shown
// by their fields until the next sending.
import { defineCommand } from "../../../../state/index.ts";

export const setFormErrors = defineCommand<{
  viewId: string;
  propertyIds: readonly string[];
}>({
  type: "form.setErrors",
  handle(state, command) {
    const { viewId, propertyIds } = command;
    const formErrors =
      propertyIds.length === 0
        ? null
        : { viewId, propertyIds: [...propertyIds] };
    return { ui: { ...state.ui, formErrors } };
  },
});

export const formCommands = [setFormErrors];
