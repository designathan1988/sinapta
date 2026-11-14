export type { BlockDefinition } from "./block-definition.ts";
export {
  BLOCK_COMMANDS,
  BLOCK_TIDIERS,
  BLOCK_DEFINITIONS,
  BLOCK_PROPS_SCHEMAS,
  blockDefinition,
} from "./block-registry.ts";
export { isTextBlock, textOf, type TextBlock } from "./text-block.ts";
export { countText, type WordCount } from "./text-count.ts";
