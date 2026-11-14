// The part of the `ui` slice that is saved and restored on reload.
import * as v from "valibot";
import { blockIdSchema, viewIdSchema } from "../model/index.ts";
import {
  createInitialUiState,
  NOTICE_KINDS,
  type UiState,
} from "./app-state.ts";
import { PEEK_WIDTH } from "./widths.ts";

const persistedUiSchema = v.object({
  activePageId: v.nullable(blockIdSchema),
  expandedPageIds: v.optional(v.array(blockIdSchema), []),
  activeViewIds: v.optional(v.record(blockIdSchema, viewIdSchema), {}),
  sidebarWidth: v.number(),
  peekWidth: v.optional(v.number(), PEEK_WIDTH.initial),
  isSidebarCollapsed: v.boolean(),
  recentPageIds: v.optional(v.array(blockIdSchema), []),
  isHomeOpen: v.optional(v.boolean(), false),
  readReminders: v.optional(v.array(v.string()), []),
  mutedNotices: v.optional(v.array(v.picklist(NOTICE_KINDS)), []),
  desktopNotices: v.optional(v.boolean(), false),
  pushNotices: v.optional(v.boolean(), false),
  commentNotices: v.optional(
    v.record(v.string(), v.picklist(["all", "replies"])),
    {},
  ),
});

export type PersistedUi = v.InferOutput<typeof persistedUiSchema>;

export function toPersistedUi(ui: UiState): PersistedUi {
  return {
    activePageId: ui.activePageId,
    expandedPageIds: [...ui.expandedPageIds],
    activeViewIds: { ...ui.activeViewIds },
    sidebarWidth: ui.sidebarWidth,
    peekWidth: ui.peekWidth,
    isSidebarCollapsed: ui.isSidebarCollapsed,
    recentPageIds: [...ui.recentPageIds],
    isHomeOpen: ui.isHomeOpen,
    readReminders: [...ui.readReminders],
    mutedNotices: [...ui.mutedNotices],
    desktopNotices: ui.desktopNotices,
    pushNotices: ui.pushNotices,
    commentNotices: { ...ui.commentNotices },
  };
}

// Stored interface state that does not parse is dropped, not repaired: the
// app starts with its initial interface state instead.
export function restoreUi(json: unknown): UiState {
  const result = v.safeParse(persistedUiSchema, json);
  const initial = createInitialUiState();
  return result.success ? { ...initial, ...result.output } : initial;
}
