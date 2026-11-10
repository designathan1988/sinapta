import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const DIVIDER_TYPE = "divider";

export const dividerPropsSchema = v.object({});

export type DividerProps = Record<string, never>;
export type DividerBlock = TypedBlock<typeof DIVIDER_TYPE, DividerProps>;
