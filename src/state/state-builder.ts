// Builds a store and dispatcher for tests in any layer, with a fixed clock
// and predictable ids.
import { TEST_TIME, toBlockId, type Workspace } from "../model/index.ts";
import { createInitialState, type AppState } from "./app-state.ts";
import {
  createCommandRegistry,
  defineCommand,
  type CommandDefinition,
} from "./command-registry.ts";
import { createDispatcher, type Dispatch } from "./dispatch.ts";
import { createAppStore, type AppStore } from "./store.ts";
import type { Tidier } from "./tidy.ts";

export interface TestApp {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
}

export interface TestAppOptions {
  readonly workspace?: Workspace;
  readonly commands?: readonly CommandDefinition<never>[];
  readonly tidiers?: readonly Tidier[];
}

export function createTestApp(options: TestAppOptions = {}): TestApp {
  const initial = createInitialState();
  const state: AppState = {
    ...initial,
    workspace: options.workspace ?? initial.workspace,
  };
  const store = createAppStore(state);
  let nextId = 0;
  const dispatch = createDispatcher({
    store,
    registry: createCommandRegistry(options.commands ?? []),
    now: () => TEST_TIME,
    createId: () => toBlockId(`new-${String((nextId += 1))}`),
    ...(options.tidiers && { tidiers: options.tidiers }),
  });
  return { store, dispatch };
}

// A minimal workspace command for tests of the dispatcher and history:
// adds a top-level block.
export const addTestBlock = defineCommand<{ blockType: string }>({
  type: "test.addBlock",
  newBlockIds: 1,
  handle(state, command) {
    const id = command.meta.blockIds[0];
    if (id === undefined) return {};
    const { now } = command.meta;
    return {
      operations: [
        {
          type: "record.create",
          kind: "block",
          record: {
            id,
            type: command.blockType,
            parentId: null,
            childIds: [],
            props: {},
            createdAt: now,
            updatedAt: now,
          },
        },
        {
          type: "list.insert",
          list: { kind: "rootIds" },
          id,
          index: state.workspace.rootIds.length,
        },
      ],
    };
  },
});
