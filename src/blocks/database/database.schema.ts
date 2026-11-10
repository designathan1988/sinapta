import * as v from "valibot";
import {
  propertyIdSchema,
  richTextSchema,
  viewIdSchema,
  type TypedBlock,
} from "../../model/index.ts";
import { type DATABASE_TYPE } from "../page/index.ts";

export const selectOptionSchema = v.object({
  id: v.string(),
  name: v.string(),
  // The name of a chip color token group, such as "blue".
  color: v.string(),
});

export const propertyDefinitionSchema = v.object({
  id: propertyIdSchema,
  name: v.string(),
  // A property type registered in the property registry.
  type: v.string(),
  // The choices of a select or multi-select property.
  options: v.optional(v.array(selectOptionSchema)),
});

// A database is listed and opened like a page, so it carries the page
// props, plus its columns and its views. Its rows are its child pages.
export const databasePropsSchema = v.object({
  title: richTextSchema,
  icon: v.nullable(v.string()),
  isFavorite: v.boolean(),
  isTrashed: v.boolean(),
  properties: v.array(propertyDefinitionSchema),
  viewIds: v.array(viewIdSchema),
});

export type SelectOption = v.InferOutput<typeof selectOptionSchema>;
export type PropertyDefinition = v.InferOutput<typeof propertyDefinitionSchema>;
export type DatabaseProps = v.InferOutput<typeof databasePropsSchema>;
export type DatabaseBlock = TypedBlock<typeof DATABASE_TYPE, DatabaseProps>;
