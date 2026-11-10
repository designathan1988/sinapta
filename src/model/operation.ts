// The smallest changes to workspace data. A command handler returns a list
// of these; the dispatcher applies the list as one transaction.
import type { Block } from "./block.schema.ts";
import type { BlockId, ViewId } from "./id.schema.ts";
import type { View } from "./view.schema.ts";
import type { Settings } from "./workspace.schema.ts";

export type ListRef =
  | { readonly kind: "rootIds" }
  | { readonly kind: "childIds"; readonly blockId: BlockId };

export type Operation =
  | {
      readonly type: "record.create";
      readonly kind: "block";
      readonly record: Block;
    }
  | {
      readonly type: "record.create";
      readonly kind: "view";
      readonly record: View;
    }
  | {
      readonly type: "record.update";
      readonly kind: "block";
      readonly id: BlockId;
      readonly patch: Partial<Omit<Block, "id">>;
    }
  | {
      readonly type: "record.update";
      readonly kind: "view";
      readonly id: ViewId;
      readonly patch: Partial<Omit<View, "id">>;
    }
  | {
      readonly type: "record.update";
      readonly kind: "settings";
      readonly patch: Partial<Settings>;
    }
  | {
      readonly type: "record.delete";
      readonly kind: "block";
      readonly id: BlockId;
    }
  | {
      readonly type: "record.delete";
      readonly kind: "view";
      readonly id: ViewId;
    }
  | {
      readonly type: "list.insert";
      readonly list: ListRef;
      readonly id: BlockId;
      readonly index: number;
    }
  | {
      readonly type: "list.remove";
      readonly list: ListRef;
      readonly id: BlockId;
    };

export type OperationError =
  | { readonly kind: "missing-record"; readonly id: string }
  | { readonly kind: "duplicate-record"; readonly id: string }
  | { readonly kind: "missing-list-item"; readonly id: string }
  | { readonly kind: "index-out-of-range"; readonly index: number };

// What a transaction touched, so that the repository saves only that.
export interface ChangedRecords {
  readonly blockIds: ReadonlySet<BlockId>;
  readonly viewIds: ReadonlySet<ViewId>;
  // rootIds or settings changed.
  readonly hasMetaChange: boolean;
}
