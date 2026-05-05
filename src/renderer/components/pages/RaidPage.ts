import { rosterStore } from "../../store/RosterStore";
import { createRhEventPicker } from "../molecules/RhEventPicker";

interface RaidMatchEntry {
  name: string;
  raidHelperName: string;
  rollModifier: string;
  eventName: string;
}

function showEventPicker(onSubmit: (eventId: string) => void): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal modal--wide";

  const title = document.createElement("h3");
  title.className = "modal__title";
  title.textContent = "Load Raid Helper Event";
  modal.appendChild(title);

  const picker = createRhEventPicker({
    onSelect: (ev) => {
      overlay.remove();
      onSubmit(String(ev.id ?? ""));
    },
  });
  modal.appendChild(picker);

  const actions = document.createElement("div");
  actions.className = "modal__actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => overlay.remove());
  actions.appendChild(cancelBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function buildResultForm(matches: RaidMatchEntry[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "raid-form";

  const list = document.createElement("div");
  list.className = "raid-list";

  const listHeader = document.createElement("div");
  listHeader.className = "raid-row raid-row--header";
  listHeader.innerHTML =
    `<span class="raid-col raid-col--name">Name</span>` +
    `<span class="raid-col raid-col--rh-name">Raid-Helper Name</span>` +
    `<span class="raid-col raid-col--modifier">Roll Modifier</span>` +
    `<span class="raid-col raid-col--event-name">Event Sign-Up Name</span>`;
  list.appendChild(listHeader);

  for (const entry of matches) {
    const row = document.createElement("div");
    row.className = "raid-row";
    if (!entry.name) row.classList.add("raid-row--unmatched");

    const nameCol = document.createElement("span");
    nameCol.className = "raid-col raid-col--name";
    nameCol.textContent = entry.name || "—";

    const rhNameCol = document.createElement("span");
    rhNameCol.className = "raid-col raid-col--rh-name";
    rhNameCol.textContent = entry.raidHelperName || "—";

    const modCol = document.createElement("span");
    modCol.className = "raid-col raid-col--modifier";
    modCol.textContent = entry.rollModifier || "—";

    const eventNameCol = document.createElement("span");
    eventNameCol.className = "raid-col raid-col--event-name";
    eventNameCol.textContent = entry.eventName;

    row.appendChild(nameCol);
    row.appendChild(rhNameCol);
    row.appendChild(modCol);
    row.appendChild(eventNameCol);
    list.appendChild(row);
  }

  container.appendChild(list);

  const footer = document.createElement("div");
  footer.className = "raid-footer";

  const statusMsg = document.createElement("span");
  statusMsg.className = "raid-status";
  footer.appendChild(statusMsg);

  const exportBtn = document.createElement("button");
  exportBtn.className = "btn btn--primary";
  exportBtn.textContent = "Export to clipboard";
  exportBtn.addEventListener("click", async () => {
    const data = matches.map((m) => ({
      name: m.name,
      raidHelperName: m.raidHelperName,
      rollModifier: m.rollModifier,
      eventName: m.eventName,
    }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      statusMsg.textContent = "Copied to clipboard!";
      statusMsg.className = "raid-status raid-status--success";
      setTimeout(() => { statusMsg.textContent = ""; }, 3000);
    } catch {
      statusMsg.textContent = "Failed to copy to clipboard.";
      statusMsg.className = "raid-status raid-status--error";
    }
  });

  footer.appendChild(exportBtn);
  container.appendChild(footer);

  return container;
}

export function createRaidPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page raid-page";

  const toolbar = document.createElement("div");
  toolbar.className = "loot-history-toolbar";

  const exportBtn = document.createElement("button");
  exportBtn.className = "btn btn--primary";
  exportBtn.textContent = "Export Roll Modifiers";

  toolbar.appendChild(exportBtn);
  page.appendChild(toolbar);

  const content = document.createElement("div");
  content.className = "raid-content";
  page.appendChild(content);

  exportBtn.addEventListener("click", () => {
    showEventPicker(async (eventId) => {
      content.innerHTML = "";

      const spinner = document.createElement("div");
      spinner.className = "attendance-loading";
      spinner.innerHTML = '<div class="spinner"></div><span>Loading event data...</span>';
      content.appendChild(spinner);

      try {
        const event = await window.api.fetchRaidHelperEvent(eventId);
        const roster = rosterStore.getAll();

        const signUps = event.signUps.filter((s) => s.className !== "Absence");

        const matches: RaidMatchEntry[] = signUps.map((signUp) => {
          const lower = signUp.name.toLowerCase();

          const rosterEntry =
            roster.find((r) => r.raidHelperName.toLowerCase() === lower) ??
            roster.find((r) => r.name.toLowerCase() === lower);

          return {
            name: rosterEntry?.name ?? "",
            raidHelperName: rosterEntry?.raidHelperName ?? "",
            rollModifier: rosterEntry?.rollModifier ?? "",
            eventName: signUp.name,
          };
        });

        content.innerHTML = "";
        content.appendChild(buildResultForm(matches));
      } catch (err) {
        content.innerHTML = "";
        const errEl = document.createElement("div");
        errEl.className = "attendance-error";
        errEl.textContent = `Failed to load event: ${err instanceof Error ? err.message : err}`;
        content.appendChild(errEl);
      }
    });
  });

  return page;
}
