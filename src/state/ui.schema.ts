// The part of the `ui` slice that is saved and restored on reload.
import * as v from "valibot";
import { blockIdSchema } from "../model/index.ts";
import { createInitialUiState, type UiState } from "./app-state.ts";

const persistedUiSchema = v.object({
  activePageId: v.nullable(blockIdSchema),
  sidebarWidth: v.number(),
  isSidebarCollapsed: v.boolean(),
});

export type PersistedUi = v.InferOutput<typeof persistedUiSchema>;

export function toPersistedUi(ui: UiState): PersistedUi {
  const { activePageId, sidebarWidth, isSidebarCollapsed } = ui;
  return { activePageId, sidebarWidth, isSidebarCollapsed };
}

// Stored interface state that does not parse is dropped, not repaired: the
// app starts with its initial interface state instead.
export function restoreUi(json: unknown): UiState {
  const result = v.safeParse(persistedUiSchema, json);
  const initial = createInitialUiState();
  return result.success ? { ...initial, ...result.output } : initial;
}
