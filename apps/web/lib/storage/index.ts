import { MemoryAdapter, type Storage } from "@boardatwork/game-core";
import { LocalStorageAdapter } from "./local-adapter";

let instance: Storage | undefined;

/**
 * The single source of a `Storage` instance for the app (ADR-0004). Every
 * component/game that needs to read or write results/stats/settings calls
 * this instead of constructing an adapter itself, so swapping in a
 * Supabase-backed adapter later is a one-file change.
 */
export function getStorage(): Storage {
  instance ??=
    typeof window === "undefined" ? new MemoryAdapter() : new LocalStorageAdapter();
  return instance;
}

export type { Storage } from "@boardatwork/game-core";
