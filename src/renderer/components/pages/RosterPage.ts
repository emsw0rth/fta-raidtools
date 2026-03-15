import { createGrid, GridApi, GridOptions, ColDef, AllCommunityModule, ModuleRegistry, themeAlpine, colorSchemeDark } from "ag-grid-community";
import { RosterEntry } from "../../models/RosterEntry";

ModuleRegistry.registerModules([AllCommunityModule]);

const SHEET_NAME = "roster";
const HEADERS = ["Name", "Rank", "Class", "MS", "OS", "Alt", "Profession 1", "Profession 2", "Notes"];

const columnDefs: ColDef<RosterEntry>[] = [
  { field: "name", headerName: "Name", width: 140 },
  { field: "rank", headerName: "Rank", width: 110 },
  { field: "class", headerName: "Class", width: 120 },
  { field: "ms", headerName: "MS", width: 120 },
  { field: "os", headerName: "OS", width: 120 },
  { field: "alt", headerName: "Alt", width: 140 },
  { field: "profession1", headerName: "Profession 1", width: 160 },
  { field: "profession2", headerName: "Profession 2", width: 160 },
  { field: "notes", headerName: "Notes", flex: 1, minWidth: 160 },
];

let gridApi: GridApi<RosterEntry> | null = null;

function parseSheetRows(rows: string[][]): RosterEntry[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => ({
    name: row[0]?.trim() ?? "",
    rank: row[1]?.trim() ?? "",
    class: row[2]?.trim() ?? "",
    ms: row[3]?.trim() ?? "",
    os: row[4]?.trim() ?? "",
    alt: row[5]?.trim() ?? "",
    profession1: row[6]?.trim() ?? "",
    profession2: row[7]?.trim() ?? "",
    notes: row[8]?.trim() ?? "",
  }));
}

function getAllRows(): RosterEntry[] {
  const rows: RosterEntry[] = [];
  gridApi?.forEachNode((node) => {
    if (node.data) rows.push(node.data);
  });
  return rows;
}

let spinnerEl: HTMLElement | null = null;

function showSpinner(): void {
  if (spinnerEl) spinnerEl.style.display = "flex";
}

function hideSpinner(): void {
  if (spinnerEl) spinnerEl.style.display = "none";
}

async function loadFromSheet(silent = false): Promise<void> {
  const config = await window.api.loadConfig();
  if (!config.googleSheetUrl || !config.serviceAccountKeyPath) {
    if (!silent) alert("Configure Google Sheet URL and service account key in Settings.");
    return;
  }

  showSpinner();
  try {
    const rows = await window.api.fetchSheet(SHEET_NAME);
    const entries = parseSheetRows(rows);
    gridApi?.setGridOption("rowData", entries);
  } catch (err) {
    if (!silent) alert(`Failed to load roster: ${err instanceof Error ? err.message : err}`);
  } finally {
    hideSpinner();
  }
}

async function saveToSheet(): Promise<void> {
  const config = await window.api.loadConfig();
  if (!config.googleSheetUrl || !config.serviceAccountKeyPath) {
    alert("Configure Google Sheet URL and service account key in Settings.");
    return;
  }

  const entries = getAllRows();
  const dataRows = entries.map((e) => [
    e.name, e.rank, e.class, e.ms, e.os, e.alt, e.profession1, e.profession2, e.notes,
  ]);
  await window.api.writeSheet(SHEET_NAME, [HEADERS, ...dataRows]);
}

interface FieldDef {
  key: keyof RosterEntry;
  label: string;
  placeholder: string;
}

const formFields: FieldDef[] = [
  { key: "name", label: "Name", placeholder: "Character name" },
  { key: "rank", label: "Rank", placeholder: "e.g. Officer, Raider, Trial" },
  { key: "class", label: "Class", placeholder: "e.g. Shaman, Warrior, Paladin" },
  { key: "ms", label: "Main Spec (MS)", placeholder: "e.g. Restoration" },
  { key: "os", label: "Off Spec (OS)", placeholder: "e.g. Elemental" },
  { key: "alt", label: "Alt", placeholder: "e.g. no, yes - MainName" },
  { key: "profession1", label: "Profession 1", placeholder: "e.g. Leatherworking 375" },
  { key: "profession2", label: "Profession 2", placeholder: "e.g. Enchanting 300" },
  { key: "notes", label: "Notes", placeholder: "Any additional notes" },
];

function showAddMemberModal(onAdd: (entry: RosterEntry) => void): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const title = document.createElement("h3");
  title.className = "modal__title";
  title.textContent = "Add Member";
  modal.appendChild(title);

  const inputs: Record<string, HTMLInputElement> = {};

  formFields.forEach((field) => {
    const group = document.createElement("div");
    group.className = "modal__field";

    const label = document.createElement("label");
    label.className = "modal__label";
    label.textContent = field.label;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "modal__input";
    input.placeholder = field.placeholder;
    inputs[field.key] = input;

    group.appendChild(label);
    group.appendChild(input);
    modal.appendChild(group);
  });

  const actions = document.createElement("div");
  actions.className = "modal__actions";

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--primary";
  addBtn.textContent = "Add to Roster";
  addBtn.addEventListener("click", () => {
    const entry: RosterEntry = {
      name: inputs.name.value.trim(),
      rank: inputs.rank.value.trim(),
      class: inputs.class.value.trim(),
      ms: inputs.ms.value.trim(),
      os: inputs.os.value.trim(),
      alt: inputs.alt.value.trim(),
      profession1: inputs.profession1.value.trim(),
      profession2: inputs.profession2.value.trim(),
      notes: inputs.notes.value.trim(),
    };
    if (!entry.name) {
      inputs.name.focus();
      return;
    }
    onAdd(entry);
    overlay.remove();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => overlay.remove());

  actions.appendChild(addBtn);
  actions.appendChild(cancelBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  inputs.name.focus();
}

export function createRosterPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page roster-page";

  const toolbar = document.createElement("div");
  toolbar.className = "loot-history-toolbar";

  const loadBtn = document.createElement("button");
  loadBtn.className = "btn btn--primary";
  loadBtn.textContent = "Load from Sheet";
  loadBtn.addEventListener("click", () => {
    loadBtn.disabled = true;
    loadBtn.textContent = "Loading...";
    loadFromSheet().finally(() => {
      loadBtn.disabled = false;
      loadBtn.textContent = "Load from Sheet";
    });
  });

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary";
  saveBtn.textContent = "Save to Sheet";
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      await saveToSheet();
      saveBtn.textContent = "Saved!";
      setTimeout(() => { saveBtn.textContent = "Save to Sheet"; }, 2000);
    } catch (err) {
      alert(`Failed to save roster: ${err instanceof Error ? err.message : err}`);
      saveBtn.textContent = "Save to Sheet";
    } finally {
      saveBtn.disabled = false;
    }
  });

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--primary";
  addBtn.textContent = "Add Member";
  addBtn.addEventListener("click", () => {
    showAddMemberModal(async (entry) => {
      gridApi?.applyTransaction({ add: [entry] });
      try {
        await saveToSheet();
      } catch (err) {
        alert(`Member added locally but failed to save: ${err instanceof Error ? err.message : err}`);
      }
    });
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn--danger";
  deleteBtn.textContent = "Delete Selected";
  deleteBtn.addEventListener("click", () => {
    const selected = gridApi?.getSelectedRows();
    if (selected && selected.length > 0) {
      gridApi?.applyTransaction({ remove: selected });
    }
  });

  toolbar.appendChild(loadBtn);
  toolbar.appendChild(saveBtn);
  toolbar.appendChild(addBtn);
  toolbar.appendChild(deleteBtn);
  page.appendChild(toolbar);

  const gridWrap = document.createElement("div");
  gridWrap.className = "grid-wrap";

  spinnerEl = document.createElement("div");
  spinnerEl.className = "grid-spinner";
  spinnerEl.innerHTML = '<div class="spinner"></div>';

  const gridContainer = document.createElement("div");
  gridContainer.className = "loot-history-grid";

  gridWrap.appendChild(spinnerEl);
  gridWrap.appendChild(gridContainer);
  page.appendChild(gridWrap);

  const gridOptions: GridOptions<RosterEntry> = {
    theme: themeAlpine.withPart(colorSchemeDark),
    columnDefs,
    rowData: [],
    defaultColDef: {
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
    },
    rowSelection: { mode: "multiRow" },
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 20,
  };

  gridApi = createGrid(gridContainer, gridOptions);

  // Auto-load from sheet on startup
  loadFromSheet(true);

  return page;
}
