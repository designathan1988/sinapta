import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  parseWorkspaceFile,
  toBlockId,
} from "../model/index.ts";
import { createInitialState, type AppState } from "../state/index.ts";
import {
  BLOCK_DEFINITIONS,
  BLOCK_PROPS_SCHEMAS,
  blockDefinition,
} from "./block-registry.ts";

// Everything the app needs from a block type comes from its definition, so
// a new type is one folder and one line in the registry. These checks run
// over every registered type and would fail for a type that needs more.
describe.each(BLOCK_DEFINITIONS)("block type $type", (definition) => {
  const props = definition.createProps([{ text: "sample" }]);
  const block = {
    id: toBlockId("b"),
    type: definition.type,
    parentId: toBlockId("page"),
    childIds: [],
    props,
    createdAt: "",
    updatedAt: "",
  };

  it("is found by its type", () => {
    expect(blockDefinition(definition.type)).toBe(definition);
  });

  it("registers a props schema for loading and import", () => {
    expect(BLOCK_PROPS_SCHEMAS.get(definition.type)).toBe(
      definition.propsSchema,
    );
  });

  it("continues as a registered type when Enter is pressed", () => {
    expect(blockDefinition(definition.continuesAs)).toBeDefined();
  });

  it("creates props that load back from a file, unless it needs a target", () => {
    const file = {
      schemaVersion: 1,
      rootIds: [],
      blocks: { b: block },
      views: {},
      settings: { theme: "system" },
    };
    const result = parseWorkspaceFile(file, BLOCK_PROPS_SCHEMAS);
    const isLoaded = result.ok && result.skipped.length === 0;
    const needsTarget =
      definition.label === undefined && definition.type !== "page";

    expect(isLoaded || needsTarget).toBe(true);
  });

  it("renders its own content when it has any", () => {
    const state: AppState = {
      ...createInitialState(),
      workspace: buildWorkspace([{ id: "page" }]),
    };
    const dispatch = () => ({ ok: true }) as const;

    expect(() => definition.render?.(block, dispatch, state)).not.toThrow();
  });
});

describe("the block registry", () => {
  it("has no two definitions for one type", () => {
    const types = BLOCK_DEFINITIONS.map((definition) => definition.type);

    expect(new Set(types).size).toBe(types.length);
  });
});
