import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export interface AppConfig {
  googleSheetUrl: string;
  serviceAccountKeyPath: string;
}

const defaults: AppConfig = {
  googleSheetUrl: "",
  serviceAccountKeyPath: "",
};

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

export function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveConfig(config: AppConfig): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}
