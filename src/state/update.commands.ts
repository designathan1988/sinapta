// A new version of the app, once its service worker has installed it:
// offered, then applied when the person asks, or put away until later.
import { defineCommand, type NoPayload } from "./command-registry.ts";

export const updateReady = defineCommand<NoPayload>({
  type: "app.updateReady",
  handle: ({ ui }) =>
    ui.update === "ready" ? {} : { ui: { ...ui, update: "ready" } },
});

// The worker that serves the app watches for this and hands over to the
// new version, which then reloads the page.
export const applyUpdate = defineCommand<NoPayload>({
  type: "app.applyUpdate",
  handle: ({ ui }) =>
    ui.update === "ready" ? { ui: { ...ui, update: "applying" } } : {},
});

export const dismissUpdate = defineCommand<NoPayload>({
  type: "app.dismissUpdate",
  handle: ({ ui }) =>
    ui.update === "ready" ? { ui: { ...ui, update: "none" } } : {},
});

export const updateCommands = [updateReady, applyUpdate, dismissUpdate];
