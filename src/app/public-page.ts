// A page published to the web (ADR-0013): read from the server, shown
// read-only with the sidebar hidden, nothing kept in the browser.
import { BLOCK_PROPS_SCHEMAS } from "../blocks/index.ts";
import { withPropertyConfigs } from "../features/database/index.ts";
import { parseBlockId } from "../model/index.ts";
import { createSyncLink, readWorkspaceFile } from "../persistence/index.ts";
import {
  createAppStore,
  createInitialState,
  loadServerWorkspace,
  setActivePage,
  showPublicPage,
  toggleSidebar,
} from "../state/index.ts";
import { createAppDispatch } from "./bootstrap.ts";
import { rootRenderer } from "./root-render.ts";

export interface PublicAddress {
  readonly workspaceId: string;
  readonly pageId: string;
}

// "/p/<workspace>/<page>", the address the Publish tab gives.
export function publicAddressOf(path: string): PublicAddress | undefined {
  const match = /^\/p\/([^/]+)\/([^/]+)\/?$/.exec(path);
  const [, workspaceId, pageId] = match ?? [];
  return workspaceId === undefined || pageId === undefined
    ? undefined
    : { workspaceId, pageId };
}

export async function startPublicPage(
  container: HTMLElement,
  address: PublicAddress,
): Promise<void> {
  const store = createAppStore(createInitialState());
  const dispatch = createAppDispatch(store, createSyncLink());
  const response = await fetch(
    `/api/public/${address.workspaceId}/${address.pageId}`,
  );
  const propsSchemas = withPropertyConfigs(BLOCK_PROPS_SCHEMAS);
  const file = response.ok
    ? readWorkspaceFile(await response.text(), propsSchemas)
    : undefined;
  const pageId = parseBlockId(address.pageId);
  if (file?.ok === true && pageId !== undefined) {
    dispatch(loadServerWorkspace.create({ workspace: file.workspace }));
    dispatch(setActivePage.create({ pageId }));
  }
  dispatch(showPublicPage.create({}));
  dispatch(toggleSidebar.create({}));
  const renderRoot = rootRenderer(store, dispatch, container);
  store.subscribe(renderRoot);
  renderRoot();
}
