// What every block that holds text has in common. Text block types differ
// in how they look and in a few extra props; editing works on this shape.
import {
  plainText,
  type Block,
  type BlockProps,
  type RichText,
} from "../model/index.ts";

export type TextBlock = Block & { props: BlockProps & { text: RichText } };

// Props were checked by the block type's schema at the boundary, so the
// presence of `text` is enough to know its shape.
export function isTextBlock(block: Block | undefined): block is TextBlock {
  return block !== undefined && Array.isArray(block.props.text);
}

export function textOf(block: TextBlock): string {
  return plainText(block.props.text);
}
