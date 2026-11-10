// What a block type tells the rest of the app about itself.
import type { TemplateResult } from "lit-html";
import type {
  Block,
  BlockProps,
  PropsSchema,
  RichText,
} from "../model/index.ts";
import type { Dispatch } from "../state/index.ts";

export interface BlockDefinition {
  readonly type: string;
  readonly propsSchema: PropsSchema;
  // The type of the block that Enter creates after a block of this type.
  readonly continuesAs: string;
  // Props of a new block of this type that holds the given text.
  readonly createProps: (text: RichText) => BlockProps;
  // The block's own content, without its children. Undefined for a block
  // of another type.
  readonly render?: (
    block: Block,
    dispatch: Dispatch,
  ) => TemplateResult | undefined;
}
