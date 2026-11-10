// Defines commands and looks up their handlers by type.
import type { BlockId, Operation, Workspace } from "../model/index.ts";
import type { AppState, PersistenceState, UiState } from "./app-state.ts";

// A plain serializable object: { type: "block.move", blockId, ... }.
export interface Command {
  readonly type: string;
  readonly [key: string]: unknown;
}

// What a pure handler may not create itself; the dispatcher supplies it.
export interface CommandMeta {
  readonly now: string;
  readonly blockIds: readonly BlockId[];
}

// What a command changes. Workspace data changes only through operations.
export interface CommandEffect {
  readonly operations?: readonly Operation[];
  // Replaces all workspace data and clears history. Only loading from
  // storage and importing a file use this.
  readonly workspace?: Workspace;
  readonly ui?: UiState;
  readonly persistence?: PersistenceState;
  // Transactions with the same key that follow each other closely become
  // one undo step, so that undo removes a typed word, not one letter.
  readonly mergeKey?: string;
}

export type CommandHandler<TPayload> = (
  state: AppState,
  command: TPayload & { readonly meta: CommandMeta },
) => CommandEffect;

export interface CommandDefinition<TPayload extends object = object> {
  readonly type: string;
  // How many new block ids the dispatcher creates for the handler.
  readonly newBlockIds: number;
  create(payload: TPayload): Command;
  handle(state: AppState, command: Command, meta: CommandMeta): CommandEffect;
}

export interface CommandOptions<TPayload> {
  readonly type: string;
  readonly newBlockIds?: number;
  readonly handle: CommandHandler<TPayload>;
}

// A command with no fields besides its type.
export type NoPayload = Record<string, never>;

export function defineCommand<TPayload extends object>(
  options: CommandOptions<TPayload>,
): CommandDefinition<TPayload> {
  // Commands are built only by `create`, whose parameter is typed, so a
  // command carrying this type tag has this handler's payload.
  const isOwn = (command: Command): command is Command & TPayload =>
    command.type === options.type;
  return {
    type: options.type,
    newBlockIds: options.newBlockIds ?? 0,
    create: (payload) => ({ ...payload, type: options.type }),
    handle(state, command, meta) {
      if (!isOwn(command)) return {};
      return options.handle(state, { ...command, meta });
    },
  };
}

export type CommandRegistry = ReadonlyMap<string, CommandDefinition<never>>;

export function createCommandRegistry(
  definitions: readonly CommandDefinition<never>[],
): CommandRegistry {
  const registry = new Map<string, CommandDefinition<never>>();
  for (const definition of definitions) {
    if (registry.has(definition.type)) {
      throw new Error(`Command "${definition.type}" is registered twice.`);
    }
    registry.set(definition.type, definition);
  }
  return registry;
}
