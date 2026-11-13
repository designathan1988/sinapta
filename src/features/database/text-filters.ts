// The conditions a text-like property is filtered by, as Notion's: Is,
// Is not, Contains, Does not contain, Starts with, Ends with, Is empty,
// Is not empty. Case and width are ignored, in every language.
import {
  containsText,
  foldText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
} from "./property-definition.ts";

function textTest(
  id: string,
  label: string,
  test: (value: string, operand: string) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test: (value, operand) =>
      typeof value === "string" && test(foldText(value), foldText(operand)),
  };
}

const IS = textTest("is", "Is", (value, operand) => value === operand);
const IS_NOT: FilterOperator = {
  id: "is-not",
  label: "Is not",
  needsOperand: true,
  test: (value, operand) =>
    typeof value !== "string" || foldText(value) !== foldText(operand),
};
const DOES_NOT_CONTAIN: FilterOperator = {
  id: "does-not-contain",
  label: "Does not contain",
  needsOperand: true,
  test: (value, operand) =>
    typeof value !== "string" || !foldText(value).includes(foldText(operand)),
};
const STARTS_WITH = textTest("starts-with", "Starts with", (value, operand) =>
  value.startsWith(operand),
);
const ENDS_WITH = textTest("ends-with", "Ends with", (value, operand) =>
  value.endsWith(operand),
);

export const TEXT_FILTERS: readonly FilterOperator[] = [
  IS,
  IS_NOT,
  containsText(),
  DOES_NOT_CONTAIN,
  STARTS_WITH,
  ENDS_WITH,
  IS_EMPTY,
  IS_NOT_EMPTY,
];
