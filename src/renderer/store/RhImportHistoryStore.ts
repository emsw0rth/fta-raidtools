import { RhImportHistoryEntry } from "../models/RhImportHistoryEntry";

type Listener = () => void;

const STORAGE_KEY = "fta-rh-import-history";

class RhImportHistoryStore {
  private entries: RhImportHistoryEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
  }

  getAll(): RhImportHistoryEntry[] {
    return [...this.entries];
  }

  hasEvent(eventId: string): boolean {
    return this.entries.some((e) => e.eventId === eventId);
  }

  add(entry: RhImportHistoryEntry): void {
    this.entries.push(entry);
    this.persist();
    this.notify();
  }

  replaceAll(entries: RhImportHistoryEntry[]): void {
    this.entries = entries;
    this.persist();
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // storage full or unavailable
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
      }
    } catch {
      this.entries = [];
    }
  }
}

export const rhImportHistoryStore = new RhImportHistoryStore();
