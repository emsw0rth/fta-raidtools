import { rhImportHistoryStore } from "../../store/RhImportHistoryStore";

export interface RhEventPickerOptions {
  onSelect: (event: RaidHelperServerEventListItem) => void;
}

interface NormalizedEvent {
  raw: RaidHelperServerEventListItem;
  id: string;
  title: string;
  leaderName: string;
  startEpochSec: number | null;
  isPast: boolean;
  alreadyImported: boolean;
}

function pickEpochSeconds(event: RaidHelperServerEventListItem): number | null {
  const candidates = [event.closingTime, event.endTime, event.startTime];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && candidate > 0) {
      // Raid Helper returns Unix seconds; tolerate ms by detecting magnitude.
      return candidate > 1e12 ? Math.floor(candidate / 1000) : Math.floor(candidate);
    }
  }
  return null;
}

function formatDateTime(epochSec: number | null): string {
  if (!epochSec) return "—";
  const d = new Date(epochSec * 1000);
  if (isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function normalize(events: RaidHelperServerEventListItem[]): NormalizedEvent[] {
  const nowSec = Math.floor(Date.now() / 1000);
  return events.map((raw) => {
    const startEpochSec = pickEpochSeconds(raw);
    return {
      raw,
      id: String(raw.id ?? ""),
      title: String(raw.title ?? "(untitled event)"),
      leaderName: String(raw.leaderName ?? ""),
      startEpochSec,
      isPast: startEpochSec !== null && startEpochSec < nowSec,
      alreadyImported: rhImportHistoryStore.hasEvent(String(raw.id ?? "")),
    };
  });
}

export function createRhEventPicker(opts: RhEventPickerOptions): HTMLElement {
  const container = document.createElement("div");
  container.className = "rh-picker";

  const controls = document.createElement("div");
  controls.className = "rh-picker__controls";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "rh-picker__search";
  searchInput.placeholder = "Filter by event name...";
  controls.appendChild(searchInput);

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "rh-picker__toggle";
  const toggleCb = document.createElement("input");
  toggleCb.type = "checkbox";
  toggleCb.checked = false;
  const toggleText = document.createElement("span");
  toggleText.textContent = "Show already-imported";
  toggleLabel.appendChild(toggleCb);
  toggleLabel.appendChild(toggleText);
  controls.appendChild(toggleLabel);

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "btn rh-picker__refresh";
  refreshBtn.type = "button";
  refreshBtn.textContent = "Refresh";
  controls.appendChild(refreshBtn);

  container.appendChild(controls);

  const status = document.createElement("div");
  status.className = "rh-picker__status";
  container.appendChild(status);

  const listWrap = document.createElement("div");
  listWrap.className = "rh-picker__list";
  container.appendChild(listWrap);

  let allEvents: NormalizedEvent[] = [];

  function setStatus(text: string, kind: "info" | "error" | "empty" = "info"): void {
    status.textContent = text;
    status.className = `rh-picker__status rh-picker__status--${kind}`;
    status.style.display = text ? "flex" : "none";
  }

  function render(): void {
    listWrap.innerHTML = "";

    const showImported = toggleCb.checked;
    const search = searchInput.value.trim().toLowerCase();
    const visible = allEvents
      .filter((e) => e.isPast)
      .filter((e) => showImported || !e.alreadyImported)
      .filter((e) => !search || e.title.toLowerCase().includes(search))
      .sort((a, b) => (b.startEpochSec ?? 0) - (a.startEpochSec ?? 0));

    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "rh-picker__empty";
      if (search) {
        empty.textContent = `No events match "${searchInput.value.trim()}".`;
      } else {
        empty.textContent = allEvents.some((e) => e.isPast)
          ? "All past events have already been imported."
          : "No past events found on this server.";
      }
      listWrap.appendChild(empty);
      return;
    }

    for (const ev of visible) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "rh-picker__row";
      if (ev.alreadyImported) row.classList.add("rh-picker__row--imported");

      const dt = document.createElement("span");
      dt.className = "rh-picker__col rh-picker__col--date";
      dt.textContent = formatDateTime(ev.startEpochSec);

      const title = document.createElement("span");
      title.className = "rh-picker__col rh-picker__col--title";
      title.textContent = ev.title;

      const leader = document.createElement("span");
      leader.className = "rh-picker__col rh-picker__col--leader";
      leader.textContent = ev.leaderName;

      const badge = document.createElement("span");
      badge.className = "rh-picker__col rh-picker__col--badge";
      if (ev.alreadyImported) {
        const tag = document.createElement("span");
        tag.className = "rh-picker__badge";
        tag.textContent = "Imported";
        badge.appendChild(tag);
      }

      row.appendChild(dt);
      row.appendChild(title);
      row.appendChild(leader);
      row.appendChild(badge);
      row.addEventListener("click", () => opts.onSelect(ev.raw));
      listWrap.appendChild(row);
    }
  }

  async function load(): Promise<void> {
    listWrap.innerHTML = "";
    setStatus("");

    const config = await window.api.loadConfig();
    if (!config.raidHelperServerId || !config.raidHelperApiKey) {
      setStatus("Configure the Raid Helper server ID and API key in Settings.", "error");
      return;
    }

    const loading = document.createElement("div");
    loading.className = "rh-picker__loading";
    loading.innerHTML = '<div class="spinner"></div><span>Loading events...</span>';
    listWrap.appendChild(loading);

    try {
      const response = await window.api.fetchRaidHelperServerEvents(1);
      const events = response?.postedEvents ?? [];
      allEvents = normalize(events);
      render();
    } catch (err) {
      listWrap.innerHTML = "";
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Failed to load events: ${msg}`, "error");
    }
  }

  toggleCb.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  refreshBtn.addEventListener("click", () => { void load(); });

  void load();

  return container;
}
