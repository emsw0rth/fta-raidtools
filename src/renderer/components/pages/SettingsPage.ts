import { settingsStore } from "../../store/SettingsStore";
import { createRaidSettingsSection } from "../organisms/RaidSettingsSection";

const SETTINGS_SHEET = "settings";
const SETTINGS_HEADERS = ["Key", "Value"];

function createNumberField(labelText: string, tooltip: string): { label: HTMLLabelElement; input: HTMLInputElement } {
  const label = document.createElement("label");
  label.className = "settings-label";
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.01";
  input.className = "settings-input";
  input.placeholder = tooltip;
  input.title = tooltip;

  return { label, input };
}

function createGeneralSettings(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-tab-content";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary";
  saveBtn.textContent = "Save";

  const status = document.createElement("span");
  status.className = "settings-status";

  const topActions = document.createElement("div");
  topActions.className = "settings-actions";
  topActions.appendChild(saveBtn);
  topActions.appendChild(status);
  wrap.appendChild(topActions);

  // --- Connection Settings ---
  const connSection = document.createElement("div");
  connSection.className = "settings-section";

  const connHeading = document.createElement("h3");
  connHeading.className = "settings-section-title";
  connHeading.textContent = "Connection";
  connSection.appendChild(connHeading);

  const form = document.createElement("div");
  form.className = "settings-form";

  const urlLabel = document.createElement("label");
  urlLabel.className = "settings-label";
  urlLabel.textContent = "Google Sheet URL";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "settings-input";
  urlInput.placeholder = "https://docs.google.com/spreadsheets/d/.../edit";

  const keyLabel = document.createElement("label");
  keyLabel.className = "settings-label";
  keyLabel.textContent = "Service Account Key File";

  const keyRow = document.createElement("div");
  keyRow.className = "settings-key-row";

  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "settings-input";
  keyInput.readOnly = true;
  keyInput.placeholder = "No key file selected";

  const browseBtn = document.createElement("button");
  browseBtn.className = "btn";
  browseBtn.textContent = "Browse...";
  browseBtn.addEventListener("click", async () => {
    const path = await window.api.selectServiceAccountKey();
    if (path) keyInput.value = path;
  });

  keyRow.appendChild(keyInput);
  keyRow.appendChild(browseBtn);

  const hint = document.createElement("p");
  hint.className = "settings-hint";
  hint.textContent = "Share the Google Sheet with the service account email address (found in the key file as \"client_email\").";

  form.appendChild(urlLabel);
  form.appendChild(urlInput);
  form.appendChild(keyLabel);
  form.appendChild(keyRow);
  form.appendChild(hint);

  connSection.appendChild(form);
  wrap.appendChild(connSection);

  // --- Raid Helper Settings ---
  const rhSection = document.createElement("div");
  rhSection.className = "settings-section";

  const rhHeading = document.createElement("h3");
  rhHeading.className = "settings-section-title";
  rhHeading.textContent = "Raid Helper";
  rhSection.appendChild(rhHeading);

  const rhForm = document.createElement("div");
  rhForm.className = "settings-form";

  const rhServerLabel = document.createElement("label");
  rhServerLabel.className = "settings-label";
  rhServerLabel.textContent = "Discord Server ID";

  const rhServerInput = document.createElement("input");
  rhServerInput.type = "text";
  rhServerInput.className = "settings-input";
  rhServerInput.placeholder = "e.g. 123456789012345678";

  const rhKeyLabel = document.createElement("label");
  rhKeyLabel.className = "settings-label";
  rhKeyLabel.textContent = "API Key";

  const rhKeyInput = document.createElement("input");
  rhKeyInput.type = "password";
  rhKeyInput.className = "settings-input";
  rhKeyInput.placeholder = "From the /apikey command in your Discord";

  const rhStartLabel = document.createElement("label");
  rhStartLabel.className = "settings-label";
  rhStartLabel.textContent = "Earliest event date to load";

  const rhStartInput = document.createElement("input");
  rhStartInput.type = "date";
  rhStartInput.className = "settings-input";

  const rhHint = document.createElement("p");
  rhHint.className = "settings-hint";
  rhHint.textContent = "Run /apikey in your Discord server (admin or manage-server permission required) to view or refresh the API key. The date filter limits which events are fetched in the attendance picker.";

  rhForm.appendChild(rhServerLabel);
  rhForm.appendChild(rhServerInput);
  rhForm.appendChild(rhKeyLabel);
  rhForm.appendChild(rhKeyInput);
  rhForm.appendChild(rhStartLabel);
  rhForm.appendChild(rhStartInput);
  rhForm.appendChild(rhHint);

  rhSection.appendChild(rhForm);
  wrap.appendChild(rhSection);

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      await window.api.saveConfig({
        googleSheetUrl: urlInput.value.trim(),
        serviceAccountKeyPath: keyInput.value.trim(),
        raidHelperServerId: rhServerInput.value.trim(),
        raidHelperApiKey: rhKeyInput.value.trim(),
        raidHelperEventStartDate: rhStartInput.value.trim(),
      });

      status.textContent = "Saved!";
      setTimeout(() => { status.textContent = ""; }, 2000);
    } catch (err) {
      status.textContent = `Failed to save: ${err instanceof Error ? err.message : err}`;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  });

  window.api.loadConfig().then((config) => {
    urlInput.value = config.googleSheetUrl;
    keyInput.value = config.serviceAccountKeyPath;
    rhServerInput.value = config.raidHelperServerId;
    rhKeyInput.value = config.raidHelperApiKey;
    rhStartInput.value = config.raidHelperEventStartDate;
  });

  return wrap;
}

function createRollModifierSettings(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-tab-content";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary";
  saveBtn.textContent = "Save";

  const status = document.createElement("span");
  status.className = "settings-status";

  const topActions = document.createElement("div");
  topActions.className = "settings-actions";
  topActions.appendChild(saveBtn);
  topActions.appendChild(status);
  wrap.appendChild(topActions);

  const section = document.createElement("div");
  section.className = "settings-section";

  const heading = document.createElement("h3");
  heading.className = "settings-section-title";
  heading.textContent = "Roll Modifier Settings";
  section.appendChild(heading);

  const form = document.createElement("div");
  form.className = "settings-form";

  const minRollMod = createNumberField("Minimum rollModifier", "0");
  const maxRollMod = createNumberField("Maximum rollModifier", "10");

  form.appendChild(minRollMod.label);
  form.appendChild(minRollMod.input);
  form.appendChild(maxRollMod.label);
  form.appendChild(maxRollMod.input);

  section.appendChild(form);
  wrap.appendChild(section);

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const entries = [
        { key: "Minimum rollModifier", value: minRollMod.input.value.trim() },
        { key: "Maximum rollModifier", value: maxRollMod.input.value.trim() },
      ];
      settingsStore.replaceAll(entries);

      const settingsRows = [
        SETTINGS_HEADERS,
        ...entries.map((e) => [e.key, e.value]),
      ];
      await window.api.writeSheet(SETTINGS_SHEET, settingsRows);

      status.textContent = "Saved!";
      setTimeout(() => { status.textContent = ""; }, 2000);
    } catch (err) {
      status.textContent = `Failed to save: ${err instanceof Error ? err.message : err}`;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  });

  function loadFromStore(): void {
    minRollMod.input.value = settingsStore.get("Minimum rollModifier");
    maxRollMod.input.value = settingsStore.get("Maximum rollModifier");
  }

  loadFromStore();
  settingsStore.subscribe(loadFromStore);

  return wrap;
}

export function createSettingsPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page settings-page";

  const heading = document.createElement("h2");
  heading.textContent = "Settings";
  page.appendChild(heading);

  const tabBar = document.createElement("div");
  tabBar.className = "settings-tabs";
  page.appendChild(tabBar);

  interface TabSpec {
    label: string;
    build: () => HTMLElement;
  }

  // ag-grid measures itself at creation time, so the Raid Settings section is
  // built lazily on first activation to avoid a broken grid layout caused by
  // the tab starting hidden via display:none.
  const tabs: TabSpec[] = [
    { label: "General Settings", build: createGeneralSettings },
    { label: "Roll Modifier Settings", build: createRollModifierSettings },
    { label: "Raid Settings", build: createRaidSettingsSection },
  ];

  const tabContents: (HTMLElement | null)[] = tabs.map(() => null);
  const tabButtons: HTMLButtonElement[] = [];

  function activate(index: number): void {
    tabs.forEach((_, i) => {
      tabButtons[i].classList.toggle("settings-tab--active", i === index);
    });

    if (!tabContents[index]) {
      const built = tabs[index].build();
      built.classList.add("settings-tab-content");
      page.appendChild(built);
      tabContents[index] = built;
    }

    tabContents.forEach((el, i) => {
      if (el) el.style.display = i === index ? "" : "none";
    });
  }

  tabs.forEach((tab, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settings-tab";
    btn.textContent = tab.label;
    btn.addEventListener("click", () => activate(index));
    tabBar.appendChild(btn);
    tabButtons.push(btn);
  });

  activate(0);

  return page;
}
