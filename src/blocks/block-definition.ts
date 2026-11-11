// What a block type tells the rest of the app about itself.
import type { TemplateResult } from "lit-html";
import type {
  Block,
  BlockId,
  BlockProps,
  PropsSchema,
  RichText,
} from "../model/index.ts";
import type {
  AppState,
  CommandDefinition,
  Dispatch,
  Tidier,
} from "../state/index.ts";

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
  // Commands that only this block type uses, registered with all others.
  readonly commands?: readonly CommandDefinition<never>[];
  // Keeps blocks of this type tidy after any command; see state/tidy.ts.
  readonly tidy?: Tidier;
  // Other blocks may be moved inside it, as into a column, though it has
  // no text of its own.
  readonly holdsBlocks?: boolean;
  // The block whose children this block shows, when not its own, as a
  // synced block's reference shows its original's.
  readonly shownHolder?: (block: Block, state: AppState) => BlockId;
  // Turned into from a text block, it starts with that text in a paragraph
  // inside it rather than after it.
  readonly startsWithChild?: boolean;
  // CSS custom properties set on the block's element, such as a column's
  // share of its row.
  readonly customProperties?: (
    block: Block,
  ) => Readonly<Record<string, string>>;
  // The block's own content, without its children. Undefined for a block
  // of another type.
  readonly render?: (
    block: Block,
    dispatch: Dispatch,
    state: AppState,
  ) => TemplateResult | undefined;
}
