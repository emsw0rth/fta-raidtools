interface RaidHelperSignUp {
  name: string;
  className: string;
  specName?: string;
  roleName?: string;
  userId: string;
  status: string;
  position: number;
  id: number;
}

interface RaidHelperEvent {
  title: string;
  date: string;
  time: string;
  leaderName: string;
  signUps: RaidHelperSignUp[];
}

interface RaidHelperServerEventListItem {
  id: string;
  serverId?: string;
  title?: string;
  description?: string;
  leaderId?: string;
  leaderName?: string;
  channelId?: string;
  channelName?: string;
  channelType?: string;
  templateId?: string;
  templateEmoteId?: string;
  date?: string;
  time?: string;
  startTime?: number;
  endTime?: number;
  closingTime?: number;
  lastUpdated?: number;
  softresId?: string;
  color?: string;
  [key: string]: unknown;
}

interface RaidHelperServerEventsResponse {
  pages?: number;
  currentPage?: number;
  eventCountOverall?: number;
  eventCountTransmitted?: number;
  postedEvents?: RaidHelperServerEventListItem[];
  [key: string]: unknown;
}

interface AppConfig {
  googleSheetUrl: string;
  serviceAccountKeyPath: string;
  raidHelperServerId: string;
  raidHelperApiKey: string;
  raidHelperEventStartDate: string;
}

interface ElectronApi {
  loadConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
  fetchSheet(sheetName: string): Promise<string[][]>;
  writeSheet(sheetName: string, values: string[][]): Promise<void>;
  openCsvFile(): Promise<string | null>;
  fetchItemTooltip(itemId: number): Promise<{ name: string; quality: number; icon: string; tooltip: string }>;
  fetchRaidHelperEvent(eventId: string): Promise<RaidHelperEvent>;
  fetchRaidHelperServerEvents(page?: number): Promise<RaidHelperServerEventsResponse>;
  selectServiceAccountKey(): Promise<string | null>;
}

interface Window {
  api: ElectronApi;
}
