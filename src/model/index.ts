export { createBlockId, createPropertyId, createViewId } from "./id.ts";
export {
  blockIdSchema,
  propertyIdSchema,
  viewIdSchema,
  type BlockId,
  type PropertyId,
  type ViewId,
} from "./id.schema.ts";
export {
  richTextSchema,
  textSpanSchema,
  type RichText,
  type TextSpan,
} from "./rich-text.schema.ts";
export {
  isBlockOfType,
  type Block,
  type BlockProps,
  type TypedBlock,
} from "./block.schema.ts";
export { type Filter, type View } from "./view.schema.ts";
export {
  SCHEMA_VERSION,
  parseWorkspaceFile,
  settingsSchema,
  type ParseWorkspaceResult,
  type PropsSchemas,
  type Settings,
  type Theme,
  type Workspace,
} from "./workspace.schema.ts";
export { createEmptyWorkspace } from "./workspace.ts";
export type { RecordError, WorkspaceFileError } from "./parse-error.ts";
export { applyOperations, type ApplyResult } from "./apply-operation.ts";
export type {
  ChangedRecords,
  ListRef,
  Operation,
  OperationError,
} from "./operation.ts";
export {
  findInvariantViolation,
  type InvariantViolation,
} from "./workspace-invariants.ts";
export {
  buildWorkspace,
  TEST_PROPS_SCHEMAS,
  TEST_TIME,
  toBlockId,
  type BlockSpec,
} from "./workspace-builder.ts";
export { diffWorkspace } from "./workspace-diff.ts";
