import { createGrid, GridApi, GridOptions, ColDef, AllCommunityModule, ModuleRegistry, themeAlpine, colorSchemeDark } from "ag-grid-community";
import { raidSettingsStore } from "../../store/RaidSettingsStore";
import { RaidSettingsEntry } from "../../models/RaidSettingsEntry";

ModuleRegistry.registerModules([AllCommunityModule]);

const SHEET_NAME = "raidsettings";
const HEADERS = ["ID", "name", "award-for-completion", "item-win-deduction", "items-deduction-max", "absence-unexcused", "did-not-sign-up"];

interface RaidSettingsFieldDef {
  key: keyof RaidSettingsEntry;
  label: string;
  placeholder: string;
}

const raidSettingsFormFields: RaidSettingsFieldDef[] = [
  { key: "id", label: "ID", placeholder: "e.g. 4" },
  { key: "name", label: "Name", placeholder: "e.g. Tempest Keep" },
  { key: "awardForCompletion", label: "Award for Completion", placeholder: "e.g. 0.2" },
  { key: "itemWinDeduction", label: "Item Win Deduction", placeholder: "e.g. 0.15" },
  { key: "itemsDeductionMax", label: "Items Deduction Max", placeholder: "e.g. 0.4" },
  { key: "absenceUnexcused", label: "Absence Unexcused", placeholder: "e.g. 0.25" },
  { key: "didNotSignUp", label: "Did Not Sign Up", placeholder: "e.g. 0.1" },
];

const raidSettingsColumnDefs: ColDef<RaidSettingsEntry>[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "name", headerName: "Name", width: 180 },
  { field: "awardForCompletion", headerName: "Award for Completion", width: 170 },
  { field: "itemWinDeduction", headerName: "Item Win Deduction", width: 160 },
  { field: "itemsDeductionMax", headerName: "Items Deduction Max", width: 170 },
  { field: "absenceUnexcused", headerName: "Absence Unexcused", width: 160 },
  { field: "didNotSignUp", headerName: "Did Not Sign Up", flex: 1, minWidth: 140 },
];

function parseRaidSettingsSheetRows(rows: string[][]): RaidSettingsEntry[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => ({
    id: row[0]?.trim() ?? "",
    name: row[1]?.trim() ?? "",
    awardForCompletion: row[2]?.trim() ?? "",
    itemWinDeduction: row[3]?.trim() ?? "",
    itemsDeductionMax: row[4]?.trim() ?? "",
    absenceUnexcused: row[5]?.trim() ?? "",
    didNotSignUp: row[6]?.trim() ?? "",
  }));
}

function showAddRaidModal(onAdd: (entry: RaidSettingsEntry) => void): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const titleRow = document.createElement("div");
  titleRow.className = "modal__header";

  const title = document.createElement("h3");
  title.className = "modal__title";
  title.textContent = "Add new Raid";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal__close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());

  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);
  modal.appendChild(titleRow);

  const inputs: Record<string, HTMLInputElement> = {};

  raidSettingsFormFields.forEach((field) => {
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
  addBtn.textContent = "Add";
  addBtn.addEventListener("click", () => {
    const entry: RaidSettingsEntry = {
      id: inputs.id.value.trim(),
      name: inputs.name.value.trim(),
      awardForCompletion: inputs.awardForCompletion.value.trim(),
      itemWinDeduction: inputs.itemWinDeduction.value.trim(),
      itemsDeductionMax: inputs.itemsDeductionMax.value.trim(),
      absenceUnexcused: inputs.absenceUnexcused.value.trim(),
      didNotSignUp: inputs.didNotSignUp.value.trim(),
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
  inputs.id.focus();
}

export function createRaidSettingsSection(): HTMLElement {
  const section = document.createElement("div");
  section.className = "raid-settings-section";

  let gridApi: GridApi<RaidSettingsEntry> | null = null;

  const getAllRows = (): RaidSettingsEntry[] => {
    const rows: RaidSettingsEntry[] = [];
    gridApi?.forEachNode((node) => {
      if (node.data) rows.push(node.data);
    });
    return rows;
  };

  const syncToStore = (): void => {
    raidSettingsStore.replaceAll(getAllRows());
  };

  const toolbar = document.createElement("div");
  toolbar.className = "loot-history-toolbar";

  const loadBtn = document.createElement("button");
  loadBtn.className = "btn btn--primary";
  loadBtn.textContent = "Load from Sheet";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary";
  saveBtn.textContent = "Save to Sheet";

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--primary";
  addBtn.textContent = "Add new Raid";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn--danger";
  deleteBtn.textContent = "Delete Selected";

  toolbar.appendChild(loadBtn);
  toolbar.appendChild(saveBtn);
  toolbar.appendChild(addBtn);
  toolbar.appendChild(deleteBtn);
  section.appendChild(toolbar);

  const gridWrap = document.createElement("div");
  gridWrap.className = "grid-wrap";

  const spinnerEl = document.createElement("div");
  spinnerEl.className = "grid-spinner";
  spinnerEl.style.display = "none";
  spinnerEl.innerHTML = '<div class="spinner"></div>';

  const gridContainer = document.createElement("div");
  gridContainer.className = "loot-history-grid";

  gridWrap.appendChild(spinnerEl);
  gridWrap.appendChild(gridContainer);
  section.appendChild(gridWrap);

  const gridOptions: GridOptions<RaidSettingsEntry> = {
    theme: themeAlpine.withPart(colorSchemeDark),
    columnDefs: raidSettingsColumnDefs,
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
    onCellValueChanged: () => {
      syncToStore();
    },
  };

  gridApi = createGrid(gridContainer, gridOptions);

  const cached = raidSettingsStore.getAll();
  if (cached.length > 0) {
    gridApi.setGridOption("rowData", cached);
  }

  raidSettingsStore.subscribe(() => {
    gridApi?.setGridOption("rowData", raidSettingsStore.getAll());
  });

  async function loadFromSheet(): Promise<void> {
    const config = await window.api.loadConfig();
    if (!config.googleSheetUrl || !config.serviceAccountKeyPath) {
      alert("Configure Google Sheet URL and service account key in Settings.");
      return;
    }

    spinnerEl.style.display = "flex";
    try {
      const rows = await window.api.fetchSheet(SHEET_NAME);
      const entries = parseRaidSettingsSheetRows(rows);
      raidSettingsStore.replaceAll(entries);
      gridApi?.setGridOption("rowData", entries);
    } catch (err) {
      alert(`Failed to load raid settings: ${err instanceof Error ? err.message : err}`);
    } finally {
      spinnerEl.style.display = "none";
    }
  }

  async function saveToSheet(): Promise<void> {
    const config = await window.api.loadConfig();
    if (!config.googleSheetUrl || !config.serviceAccountKeyPath) {
      alert("Configure Google Sheet URL and service account key in Settings.");
      return;
    }

    syncToStore();
    const entries = raidSettingsStore.getAll();
    const dataRows = entries.map((e) => [
      e.id, e.name, e.awardForCompletion, e.itemWinDeduction, e.itemsDeductionMax, e.absenceUnexcused, e.didNotSignUp,
    ]);
    await window.api.writeSheet(SHEET_NAME, [HEADERS, ...dataRows]);
  }

  loadBtn.addEventListener("click", () => {
    loadBtn.disabled = true;
    loadBtn.textContent = "Loading...";
    loadFromSheet().finally(() => {
      loadBtn.disabled = false;
      loadBtn.textContent = "Load from Sheet";
    });
  });

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      await saveToSheet();
      saveBtn.textContent = "Saved!";
      setTimeout(() => { saveBtn.textContent = "Save to Sheet"; }, 2000);
    } catch (err) {
      alert(`Failed to save raid settings: ${err instanceof Error ? err.message : err}`);
      saveBtn.textContent = "Save to Sheet";
    } finally {
      saveBtn.disabled = false;
    }
  });

  addBtn.addEventListener("click", () => {
    showAddRaidModal(async (entry) => {
      gridApi?.applyTransaction({ add: [entry] });
      try {
        await saveToSheet();
      } catch (err) {
        alert(`Raid added locally but failed to save: ${err instanceof Error ? err.message : err}`);
      }
    });
  });

  deleteBtn.addEventListener("click", () => {
    const selected = gridApi?.getSelectedRows();
    if (selected && selected.length > 0) {
      gridApi?.applyTransaction({ remove: selected });
      syncToStore();
    }
  });

  return section;
}
