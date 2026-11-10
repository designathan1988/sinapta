// What a block type tells the rest of the app about itself.
import type { TemplateResult } from "lit-html";
import type {
  Block,
  BlockProps,
  PropsSchema,
  RichText,
} from "../model/index.ts";
import type { AppState, Dispatch } from "../state/index.ts";

export interface BlockDefinition {
  readonly type: string;
  // The name shown in menus; absent for types the user cannot pick.
  readonly label?: string;
  readonly propsSchema: PropsSchema;
  // The type of the block that Enter creates after a block of this type.
  readonly continuesAs: string;
  // Enter adds a line inside the block instead of starting a new block.
  readonly isMultiline?: boolean;
  // False while the block hides its children, as a closed toggle does.
  readonly showsChildren?: (block: Block) => boolean;
  // Props of a new block of this type that holds the given text.
  readonly createProps: (text: RichText) => BlockProps;
  // The block's own content, without its children. Undefined for a block
  // of another type.
  readonly render?: (
    block: Block,
    dispatch: Dispatch,
    state: AppState,
  ) => TemplateResult | undefined;
}
