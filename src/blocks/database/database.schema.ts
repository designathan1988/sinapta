import * as v from "valibot";
import {
  blockIdSchema,
  propertyIdSchema,
  richTextSchema,
  viewIdSchema,
  type PropsReader,
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
  // What the property is for, shown as its column's hint.
  description: v.optional(v.string()),
  // The choices of a select or multi-select property.
  options: v.optional(v.array(selectOptionSchema)),
  // The settings of its type, such as a number's format, in the shape its
  // type's config schema gives; see databasePropsReader.
  config: v.optional(v.unknown()),
});

// A database is listed and opened like a page, so it carries the page
// props, plus its columns and its views. Its rows are its child pages.
export const databasePropsSchema = v.object({
  title: richTextSchema,
  icon: v.nullable(v.string()),
  isFavorite: v.boolean(),
  isTrashed: v.boolean(),
  // Shown inside its parent page's body rather than as a line that opens
  // it.
  isInline: v.optional(v.boolean()),
  properties: v.array(propertyDefinitionSchema),
  viewIds: v.array(viewIdSchema),
  // Pages new rows can start from (version 27): kept among its children,
  // so they hold values like rows, but shown in no view. New rows start
  // from the default one.
  templateIds: v.array(blockIdSchema),
  defaultTemplateId: v.nullable(blockIdSchema),
});

// Property type name to the schema of that type's config, supplied by the
// property registry so that the block does not know any property type.
export type PropertyConfigSchema = v.GenericSchema;
export type PropertyConfigSchemas = ReadonlyMap<string, PropertyConfigSchema>;

const storedPropsSchema = v.object({
  ...databasePropsSchema.entries,
  properties: v.array(v.unknown()),
});

type PropertyRead =
  | { readonly property: v.InferOutput<typeof propertyDefinitionSchema> }
  | { readonly dropped: string };

function readProperty(
  json: unknown,
  path: string,
  configSchemas: PropertyConfigSchemas,
): PropertyRead {
  const parsed = v.safeParse(propertyDefinitionSchema, json);
  if (!parsed.success) return { dropped: path };
  const property = parsed.output;
  const schema = configSchemas.get(property.type);
  if (schema === undefined || property.config === undefined) {
    return { property };
  }
  const config = v.safeParse(schema, property.config);
  return config.success
    ? { property: { ...property, config: config.output } }
    : { dropped: `${path}.config` };
}

// Reads a database's props with each property checked on its own: a
// property that is broken, or whose config does not fit its type, is
// dropped and named, and the database keeps the rest.
export function databasePropsReader(
  configSchemas: PropertyConfigSchemas,
): PropsReader {
  return (json) => {
    const parsed = v.safeParse(storedPropsSchema, json);
    if (!parsed.success) {
      const issue = parsed.issues[0];
      return { ok: false, path: v.getDotPath(issue) ?? "" };
    }
    const reads = parsed.output.properties.map((property, index) =>
      readProperty(property, `properties.${String(index)}`, configSchemas),
    );
    return {
      ok: true,
      props: {
        ...parsed.output,
        properties: reads.flatMap((read) =>
          "property" in read ? [read.property] : [],
        ),
      },
      dropped: reads.flatMap((read) =>
        "dropped" in read ? [read.dropped] : [],
      ),
    };
  };
}

export type SelectOption = v.InferOutput<typeof selectOptionSchema>;
export type PropertyDefinition = v.InferOutput<typeof propertyDefinitionSchema>;
export type DatabaseProps = v.InferOutput<typeof databasePropsSchema>;
export type DatabaseBlock = TypedBlock<typeof DATABASE_TYPE, DatabaseProps>;
