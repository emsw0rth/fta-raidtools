import { LootEntry } from "../models/LootEntry";

type Listener = () => void;

const STORAGE_KEY = "fta-loot-history";

class LootStore {
  private entries: LootEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
  }

  getAll(): LootEntry[] {
    return [...this.entries];
  }

  add(entry: LootEntry): void {
    this.entries.push(entry);
    this.persist();
    this.notify();
  }

  remove(entries: LootEntry[]): void {
    const toRemove = new Set(entries);
    this.entries = this.entries.filter((e) => !toRemove.has(e));
    this.persist();
    this.notify();
  }

  replaceAll(entries: LootEntry[]): void {
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

export const lootStore = new LootStore();
