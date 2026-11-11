import type { ImportError, SaveStatus } from "./app-state.ts";
import { defineCommand, type NoPayload } from "./command-registry.ts";

export const setSaveStatus = defineCommand<{ status: SaveStatus }>({
  type: "persistence.setSaveStatus",
  handle(state, command) {
    if (command.status === state.persistence.status) return {};
    return { persistence: { ...state.persistence, status: command.status } };
  },
});

// Asks for the workspace to be written to a file. The persistence layer
// does the writing; the store only records that it was asked.
export const requestExport = defineCommand<NoPayload>({
  type: "persistence.requestExport",
  handle: (state) => ({
    persistence: {
      ...state.persistence,
      exportRequests: state.persistence.exportRequests + 1,
    },
  }),
});

// Hands the text of a chosen file to the persistence layer to read.
export const requestImport = defineCommand<{ text: string }>({
  type: "persistence.requestImport",
  handle: (state, command) => ({
    persistence: {
      ...state.persistence,
      pendingImport: command.text,
      importError: null,
    },
  }),
});

// Records how reading the chosen file ended: null when it was imported.
export const finishImport = defineCommand<{ error: ImportError | null }>({
  type: "persistence.finishImport",
  handle: (state, command) => ({
    persistence: {
      ...state.persistence,
      pendingImport: null,
      importError: command.error,
    },
  }),
});

// Set when another tab holds the workspace for writing, and cleared when
// this tab takes it over.
export const setReadOnly = defineCommand<{ isReadOnly: boolean }>({
  type: "persistence.setReadOnly",
  handle(state, command) {
    if (command.isReadOnly === state.persistence.isReadOnly) return {};
    const persistence = {
      ...state.persistence,
      isReadOnly: command.isReadOnly,
    };
    return { persistence };
  },
});

export const persistenceCommands = [
  setSaveStatus,
  setReadOnly,
  requestExport,
  requestImport,
  finishImport,
];
