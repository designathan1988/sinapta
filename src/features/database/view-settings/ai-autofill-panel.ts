// The view settings' "AI Autofill", as Notion's: what it does, then for
// each text property its kinds (Summary, Key info, Translation), each of
// which fills that column for every row; signed out, the words alone.
import { html } from "lit-html";
import { requestSync } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import type { TableContext } from "../table-cell.view.ts";
import type { SettingsPanel } from "./settings-panel.ts";

const KINDS = ["summarize", "action-items", "translate"] as const;

function propertyItems(context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  const databaseId = model.database.id;
  return model.columns.flatMap(({ property, isTitle }): MenuEntry[] => {
    if (property.type !== "text" || isTitle) return [];
    return [
      { kind: "section", label: property.name },
      ...KINDS.map((action) => ({
        label: COPY.ai.autofillKinds[action],
        icon: "sparkles" as const,
        onSelect: () =>
          dispatch(
            requestSync.create({
              request: {
                kind: "ai-fill",
                databaseId,
                propertyId: property.id,
                action,
              },
            }),
          ),
      })),
    ];
  });
}

export function aiAutofillPanel(context: TableContext): SettingsPanel {
  const isSignedIn = context.state.persistence.account.user !== null;
  return {
    title: COPY.ai.autofill,
    back: null,
    lead: html`<p class="view-settings__note" data-lead>
      ${COPY.ai.autofillNote}
    </p>`,
    items: isSignedIn ? propertyItems(context) : [],
  };
}
