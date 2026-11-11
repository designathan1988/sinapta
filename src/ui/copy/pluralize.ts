// A noun with its English plural forms. English has only these two.
interface PluralForms {
  readonly one: string;
  readonly other: string;
}

const ENGLISH_PLURAL_RULES = new Intl.PluralRules("en");

// Picks the form of a noun that fits a count: "1 row", "0 rows", "2 rows".
export function pluralize(count: number, forms: PluralForms): string {
  const category = ENGLISH_PLURAL_RULES.select(count);
  return category === "one" ? forms.one : forms.other;
}
