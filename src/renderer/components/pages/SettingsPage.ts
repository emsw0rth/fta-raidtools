export function createSettingsPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page settings-page";

  const heading = document.createElement("h2");
  heading.textContent = "Settings";
  page.appendChild(heading);

  const form = document.createElement("div");
  form.className = "settings-form";

  // Google Sheet URL field
  const urlLabel = document.createElement("label");
  urlLabel.className = "settings-label";
  urlLabel.textContent = "Google Sheet URL";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "settings-input";
  urlInput.placeholder = "https://docs.google.com/spreadsheets/d/.../edit";

  // Service Account Key field
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

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary";
  saveBtn.textContent = "Save";

  const status = document.createElement("span");
  status.className = "settings-status";

  saveBtn.addEventListener("click", async () => {
    await window.api.saveConfig({
      googleSheetUrl: urlInput.value.trim(),
      serviceAccountKeyPath: keyInput.value.trim(),
    });
    status.textContent = "Saved!";
    setTimeout(() => { status.textContent = ""; }, 2000);
  });

  // Load current config
  window.api.loadConfig().then((config) => {
    urlInput.value = config.googleSheetUrl;
    keyInput.value = config.serviceAccountKeyPath;
  });

  form.appendChild(urlLabel);
  form.appendChild(urlInput);
  form.appendChild(keyLabel);
  form.appendChild(keyRow);
  form.appendChild(hint);

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  actions.appendChild(saveBtn);
  actions.appendChild(status);

  form.appendChild(actions);
  page.appendChild(form);

  return page;
}
