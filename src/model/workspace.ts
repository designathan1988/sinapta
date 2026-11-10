import type { Workspace } from "./workspace.schema.ts";

export function createEmptyWorkspace(): Workspace {
  return { blocks: {}, views: {}, rootIds: [], settings: { theme: "system" } };
}
