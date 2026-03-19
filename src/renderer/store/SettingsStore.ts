import { SettingsEntry } from "../models/SettingsEntry";

type Listener = () => void;

const STORAGE_KEY = "fta-settings";

class SettingsStore {
  private entries: SettingsEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
  }

  getAll(): SettingsEntry[] {
    return [...this.entries];
  }

  get(key: string): string {
    return this.entries.find((e) => e.key === key)?.value ?? "";
  }

  replaceAll(entries: SettingsEntry[]): void {
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

export const settingsStore = new SettingsStore();
