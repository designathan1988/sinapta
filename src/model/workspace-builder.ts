// Builds small workspaces for tests in any layer, so tests do not write
// large object literals by hand.
import * as v from "valibot";
import type { Block, BlockProps } from "./block.schema.ts";
import {
  blockIdSchema,
  propertyIdSchema,
  type BlockId,
  type PropertyId,
} from "./id.schema.ts";
import type { PropsSchemas, Workspace } from "./workspace.schema.ts";
import { createEmptyWorkspace } from "./workspace.ts";

// Accepts any props, for tests that do not care about a block type's shape.
export const TEST_PROPS_SCHEMAS: PropsSchemas = new Map([
  ["page", v.record(v.string(), v.unknown())],
]);

export const TEST_TIME = "2026-11-10T12:00:00.000Z";

export function toBlockId(id: string): BlockId {
  return v.parse(blockIdSchema, id);
}

export function toPropertyId(id: string): PropertyId {
  return v.parse(propertyIdSchema, id);
}

export interface BlockSpec {
  readonly id: string;
  readonly type?: string;
  readonly props?: BlockProps;
  readonly children?: readonly BlockSpec[];
}

function addBlock(
  spec: BlockSpec,
  parentId: BlockId | null,
  blocks: Record<BlockId, Block>,
): BlockId {
  const id = toBlockId(spec.id);
  const children = spec.children ?? [];
  blocks[id] = {
    id,
    type: spec.type ?? "page",
    parentId,
    childIds: children.map((child) => addBlock(child, id, blocks)),
    props: spec.props ?? {},
    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,
  };
  return id;
}

// Each spec becomes a top-level block; nested `children` become its tree.
export function buildWorkspace(roots: readonly BlockSpec[]): Workspace {
  const blocks: Record<BlockId, Block> = {};
  const rootIds = roots.map((root) => addBlock(root, null, blocks));
  return { ...createEmptyWorkspace(), blocks, rootIds };
}
