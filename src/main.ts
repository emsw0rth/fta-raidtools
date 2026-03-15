import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { loadConfig, saveConfig, AppConfig } from "./config";
import { fetchSheetData, writeSheetData } from "./googleSheets";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "..", "images", "fta-logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "index.html"));
}

function registerIpcHandlers(): void {
  ipcMain.handle("config:load", () => loadConfig());
  ipcMain.handle("config:save", (_event, config: AppConfig) => saveConfig(config));
  ipcMain.handle("sheets:fetch", async (_event, sheetName: string) => {
    const config = loadConfig();
    return fetchSheetData(config, sheetName);
  });
  ipcMain.handle("sheets:write", async (_event, sheetName: string, values: string[][]) => {
    const config = loadConfig();
    await writeSheetData(config, sheetName, values);
  });
  ipcMain.handle("wowhead:tooltip", async (_event, itemId: number) => {
    const https = await import("https");
    const url = `https://nether.wowhead.com/tbc/tooltip/item/${itemId}`;
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Wowhead returned HTTP ${res.statusCode}`));
            return;
          }
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error("Invalid JSON from Wowhead")); }
        });
      }).on("error", (err: Error) => reject(err));
    });
  });
  ipcMain.handle("dialog:open-csv", async () => {
    const result = await dialog.showOpenDialog({
      title: "Import CSV File",
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (result.canceled) return null;
    const fs = await import("fs");
    return fs.readFileSync(result.filePaths[0], "utf-8");
  });
  ipcMain.handle("dialog:select-service-account", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select Service Account Key File",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
