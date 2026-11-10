// The list of block types. A new block type is one folder and one line here.
import type { PropsSchema, PropsSchemas } from "../model/index.ts";
import { PAGE_TYPE, pagePropsSchema } from "./page/index.ts";

export interface BlockDefinition {
  readonly type: string;
  readonly propsSchema: PropsSchema;
}

export const BLOCK_DEFINITIONS: readonly BlockDefinition[] = [
  { type: PAGE_TYPE, propsSchema: pagePropsSchema },
];

export const BLOCK_PROPS_SCHEMAS: PropsSchemas = new Map(
  BLOCK_DEFINITIONS.map((definition) => [
    definition.type,
    definition.propsSchema,
  ]),
);
