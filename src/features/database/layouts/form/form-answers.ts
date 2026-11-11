// What a sent form answers: each question's value read from the form's
// fields, as its property stores it, and the required questions left
// empty.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { propertyType } from "../../property-registry.ts";

export interface Answers {
  readonly title: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly missing: readonly string[];
}

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// A question's value; undefined when it was left empty.
export function answerOf(
  data: FormData,
  property: PropertyDefinition,
): unknown {
  const { editor } = propertyType(property.type);
  if (property.type === "multi-select") {
    const ids = data.getAll(property.id).filter((id) => typeof id === "string");
    return ids.length === 0 ? undefined : ids;
  }
  if (editor === "toggle") return data.has(property.id) ? true : undefined;
  const text = textOf(data, property.id);
  if (text === "") return undefined;
  if (editor === "date") return { start: text };
  if (editor === "options") return text;
  return propertyType(property.type).parse(text);
}

export function readAnswers(
  data: FormData,
  question: {
    readonly titleId: string;
    readonly properties: readonly PropertyDefinition[];
    readonly required: readonly string[];
  },
): Answers {
  const title = textOf(data, question.titleId);
  const values: Record<string, unknown> = {};
  for (const property of question.properties) {
    const value = answerOf(data, property);
    if (value !== undefined) values[property.id] = value;
  }
  const isEmpty = (id: string): boolean =>
    id === question.titleId ? title === "" : values[id] === undefined;
  return { title, values, missing: question.required.filter(isEmpty) };
}
