// A URL property's config: whether a cell writes the whole address,
// as Notion's "Show full URL", or drops the scheme and the closing slash.
import * as v from "valibot";

export const urlConfigSchema = v.object({
  showFull: v.boolean(),
});

export type UrlConfig = v.InferOutput<typeof urlConfigSchema>;

export const DEFAULT_URL_CONFIG: UrlConfig = { showFull: false };

// The config held in memory, already checked on load, read with its type.
export function readUrlConfig(config: unknown): UrlConfig {
  return v.is(urlConfigSchema, config) ? config : DEFAULT_URL_CONFIG;
}
