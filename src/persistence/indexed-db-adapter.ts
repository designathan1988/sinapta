// The only file that talks to IndexedDB.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Block, View } from "../model/index.ts";
import type {
  StorageAdapter,
  StorageChanges,
  StoredAsset,
  StoredData,
} from "./storage-adapter.ts";
import type { SnapshotStorage, StoredSnapshot } from "./snapshot-store.ts";

// Storage identity: changing this name would hide existing data.
const DATABASE_NAME = "pagecraft";
// Changes only when the object stores change, not with the record format.
// Version 2 adds the asset store; version 3 the page versions.
const DATABASE_VERSION = 3;
const STORES = ["blocks", "views", "meta"] as const;

interface PagecraftDatabase extends DBSchema {
  blocks: { key: string; value: Block };
  views: { key: string; value: View };
  meta: { key: string; value: unknown };
  assets: { key: string; value: StoredAsset };
  snapshots: {
    key: string;
    value: StoredSnapshot;
    indexes: { pageId: string };
  };
}

function open(): Promise<IDBPDatabase<PagecraftDatabase>> {
  return openDB<PagecraftDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore("blocks", { keyPath: "id" });
        database.createObjectStore("views", { keyPath: "id" });
        database.createObjectStore("meta");
      }
      if (oldVersion < 2)
        database.createObjectStore("assets", { keyPath: "id" });
      if (oldVersion < 3) {
        const snapshots = database.createObjectStore("snapshots", {
          keyPath: "id",
        });
        snapshots.createIndex("pageId", "pageId");
      }
    },
  });
}

function byId(records: readonly { id: string }[]): Record<string, unknown> {
  return Object.fromEntries(records.map((record) => [record.id, record]));
}

async function load(): Promise<StoredData | null> {
  const database = await open();
  const transaction = database.transaction(STORES, "readonly");
  const meta = transaction.objectStore("meta");
  const [blocks, views, schemaVersion, rootIds, settings, ui] =
    await Promise.all([
      transaction.objectStore("blocks").getAll(),
      transaction.objectStore("views").getAll(),
      meta.get("schemaVersion"),
      meta.get("rootIds"),
      meta.get("settings"),
      meta.get("ui"),
    ]);
  database.close();
  if (schemaVersion === undefined) return null;
  const file = {
    schemaVersion,
    rootIds,
    settings,
    blocks: byId(blocks),
    views: byId(views),
  };
  return { file, ui };
}

async function save(changes: StorageChanges): Promise<void> {
  const database = await open();
  const transaction = database.transaction(STORES, "readwrite");
  const blocks = transaction.objectStore("blocks");
  const views = transaction.objectStore("views");
  const meta = transaction.objectStore("meta");
  for (const block of changes.putBlocks) void blocks.put(block);
  for (const id of changes.deleteBlockIds) void blocks.delete(id);
  for (const view of changes.putViews) void views.put(view);
  for (const id of changes.deleteViewIds) void views.delete(id);
  if (changes.meta !== undefined) {
    void meta.put(changes.meta.schemaVersion, "schemaVersion");
    void meta.put(changes.meta.rootIds, "rootIds");
    void meta.put(changes.meta.settings, "settings");
  }
  if (changes.ui !== undefined) void meta.put(changes.ui, "ui");
  await transaction.done;
  database.close();
}

async function loadAssets(): Promise<StoredAsset[]> {
  const database = await open();
  const assets = await database.getAll("assets");
  database.close();
  return assets;
}

async function putAssets(assets: readonly StoredAsset[]): Promise<void> {
  const database = await open();
  const transaction = database.transaction("assets", "readwrite");
  const store = transaction.objectStore("assets");
  for (const asset of assets) void store.put(asset);
  await transaction.done;
  database.close();
}

async function listSnapshots(pageId: string): Promise<StoredSnapshot[]> {
  const database = await open();
  const list = await database.getAllFromIndex("snapshots", "pageId", pageId);
  database.close();
  return list;
}

async function putSnapshot(snapshot: StoredSnapshot): Promise<void> {
  const database = await open();
  await database.put("snapshots", snapshot);
  database.close();
}

async function deleteSnapshots(ids: readonly string[]): Promise<void> {
  const database = await open();
  const transaction = database.transaction("snapshots", "readwrite");
  for (const id of ids) void transaction.store.delete(id);
  await transaction.done;
  database.close();
}

export function createIndexedDbSnapshots(): SnapshotStorage {
  return { listSnapshots, putSnapshot, deleteSnapshots };
}

export function createIndexedDbAdapter(): StorageAdapter {
  return { load, save, loadAssets, putAssets };
}
