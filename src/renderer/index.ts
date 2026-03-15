import { createAppHeader } from "./components/organisms/AppHeader";
import { createLootHistoryPage } from "./components/pages/LootHistoryPage";
import { createRosterPage } from "./components/pages/RosterPage";
import { createSettingsPage } from "./components/pages/SettingsPage";

type PageFactory = () => HTMLElement;

const pages: Record<string, PageFactory> = {
  "#loot-history": createLootHistoryPage,
  "#roster": createRosterPage,
  "#settings": createSettingsPage,
};

let main: HTMLElement;

function navigateTo(hash: string): void {
  const factory = pages[hash] ?? pages["#loot-history"];
  main.innerHTML = "";
  main.appendChild(factory());
}

function init(): void {
  const body = document.body;
  body.innerHTML = "";

  const bannerWrap = document.createElement("div");
  bannerWrap.className = "app-banner-wrap";

  const banner = document.createElement("img");
  banner.className = "app-banner";
  banner.src = "images/app-header-wide.png";
  banner.alt = "From the Ashes";

  const version = document.createElement("span");
  version.className = "app-version";
  version.textContent = "v1.0.0";

  bannerWrap.appendChild(banner);
  bannerWrap.appendChild(version);
  body.appendChild(bannerWrap);

  const header = createAppHeader((href) => navigateTo(href));
  body.appendChild(header);

  main = document.createElement("main");
  main.id = "app";
  body.appendChild(main);

  navigateTo("#loot-history");
}

document.addEventListener("DOMContentLoaded", init);
