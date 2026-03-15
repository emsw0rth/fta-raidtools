interface AppConfig {
  googleSheetUrl: string;
  serviceAccountKeyPath: string;
}

interface ElectronApi {
  loadConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
  fetchSheet(sheetName: string): Promise<string[][]>;
  writeSheet(sheetName: string, values: string[][]): Promise<void>;
  openCsvFile(): Promise<string | null>;
  fetchItemTooltip(itemId: number): Promise<{ name: string; quality: number; icon: string; tooltip: string }>;
  selectServiceAccountKey(): Promise<string | null>;
}

interface Window {
  api: ElectronApi;
}
