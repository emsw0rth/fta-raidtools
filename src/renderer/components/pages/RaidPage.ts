import { rosterStore } from "../../store/RosterStore";
import { RosterEntry } from "../../models/RosterEntry";

interface RollModifierExportEntry {
  name: string;
  raidHelperName: string;
  rollModifier: string;
}

function toExportEntries(roster: RosterEntry[]): RollModifierExportEntry[] {
  return roster.map((r) => ({
    name: r.name,
    raidHelperName: r.raidHelperName,
    rollModifier: r.rollModifier,
  }));
}

function buildResultForm(entries: RollModifierExportEntry[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "raid-form";

  const list = document.createElement("div");
  list.className = "raid-list";

  const listHeader = document.createElement("div");
  listHeader.className = "raid-row raid-row--header";
  listHeader.innerHTML =
    `<span class="raid-col raid-col--name">Name</span>` +
    `<span class="raid-col raid-col--rh-name">Raid-Helper Name</span>` +
    `<span class="raid-col raid-col--modifier">Roll Modifier</span>`;
  list.appendChild(listHeader);

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "raid-row";

    const nameCol = document.createElement("span");
    nameCol.className = "raid-col raid-col--name";
    nameCol.textContent = entry.name || "—";

    const rhNameCol = document.createElement("span");
    rhNameCol.className = "raid-col raid-col--rh-name";
    rhNameCol.textContent = entry.raidHelperName || "—";

    const modCol = document.createElement("span");
    modCol.className = "raid-col raid-col--modifier";
    modCol.textContent = entry.rollModifier || "—";

    row.appendChild(nameCol);
    row.appendChild(rhNameCol);
    row.appendChild(modCol);
    list.appendChild(row);
  }

  container.appendChild(list);

  return container;
}

export function createRaidPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page raid-page";

  const toolbar = document.createElement("div");
  toolbar.className = "loot-history-toolbar";

  const exportBtn = document.createElement("button");
  exportBtn.className = "btn btn--primary";
  exportBtn.textContent = "Export to clipboard";

  const statusMsg = document.createElement("span");
  statusMsg.className = "raid-status";

  toolbar.appendChild(exportBtn);
  toolbar.appendChild(statusMsg);
  page.appendChild(toolbar);

  const content = document.createElement("div");
  content.className = "raid-content";
  page.appendChild(content);

  const render = () => {
    const entries = toExportEntries(rosterStore.getAll());
    content.innerHTML = "";
    content.appendChild(buildResultForm(entries));
  };

  exportBtn.addEventListener("click", async () => {
    const entries = toExportEntries(rosterStore.getAll());
    try {
      await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
      statusMsg.textContent = "Copied to clipboard!";
      statusMsg.className = "raid-status raid-status--success";
      setTimeout(() => { statusMsg.textContent = ""; }, 3000);
    } catch {
      statusMsg.textContent = "Failed to copy to clipboard.";
      statusMsg.className = "raid-status raid-status--error";
    }
  });

  rosterStore.subscribe(render);
  render();

  return page;
}
