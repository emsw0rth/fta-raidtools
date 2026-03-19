# FTA Raid Tools

A desktop application for the World of Warcraft TBC Anniversary guild **From the Ashes**. Built with Electron, it connects to Google Sheets to manage guild loot history, roster, and attendance data.

## Features

### Loot History
- View and edit loot history in a sortable, filterable data grid
- Load loot data from a Google Sheet (tab: `loothistory`)
- Save changes back to the Google Sheet
- Import loot entries by pasting CSV data, with automatic duplicate detection
- OS? tracking per item — off-spec wins skip roll modifier deductions
- Deducted column shows the roll modifier cost applied for each win
- Hover over item names to see Wowhead tooltips with item icon, stats, and details

### Guild Roster
- View and edit the guild roster (tab: `roster`)
- Columns: Name, Raid-Helper name, Rank, Class, MS, OS, Main, Profession 1, Profession 2, Roll Modifier, Notes
- Add new members via a form modal that auto-saves to the sheet
- Load and save roster data to/from Google Sheets

### Attendance
- Load event data from Raid Helper by pasting an event URL
- Review sign-ups with role, class, and spec information
- Award values default to the "Award for raid completion" setting
- Map sign-ups to roster names via the "Award to" column
- Confirm & Award to apply roll modifier bonuses and save to the roster sheet
- Attendance history saved to the `attendance` sheet tab with full event data
- View previous events with clickable Raid Helper links

### Raid
- Export roll modifiers for a Raid Helper event
- Load event sign-ups and match them against the guild roster
- View Name, Raid-Helper Name, Roll Modifier, and Event Sign-Up Name
- Unmatched entries highlighted for easy identification
- "Export to clipboard" copies data as JSON for addon use

### Settings
- Configure the Google Sheet URL
- Select a Google Cloud service account key file for authentication
- **Balanced Roll settings**: New member value, Award for raid completion, Deduction on item win, Minimum rollModifier, Maximum rollModifier
- Roll modifiers are clamped to the configured minimum (on loot deductions) and maximum (on attendance awards)
- Settings stored in the `settings` sheet tab and preloaded on app start

### Auto-Update
- The app checks for new releases on GitHub at startup
- Prompts to download and install when an update is available

## Installation

Download the latest `FTA Raid Tools Setup x.x.x.exe` from the [releases](https://github.com/patrickwlarsen/fta-raidtools/releases) and run it. Windows may show a SmartScreen warning since the app is not code-signed — click "More info" > "Run anyway".

## Google Sheets Setup

The app uses a Google Cloud service account to read and write sheet data. To set this up:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable the **Google Sheets API** (APIs & Services > Library)
4. Go to **APIs & Services > Credentials > Create Credentials > Service Account**
5. Name the service account and click through the wizard
6. Go to the service account's **Keys** tab > **Add Key > Create new key > JSON**
7. Save the downloaded JSON key file somewhere safe
8. Open your Google Sheet and click **Share** — add the service account email (the `client_email` from the JSON file) as an **Editor**

### Google Sheet Structure

The Google Sheet should have the following tabs:

**`loothistory`** — columns:
| Date | Player | Item | ItemID | OS? | Deducted |
|------|--------|------|--------|-----|----------|

**`roster`** — columns:
| Name | Raid-Helper name | Rank | Class | MS | OS | Main | Profession 1 | Profession 2 | Roll Modifier | Notes |
|------|-----------------|------|-------|----|----|------|---------------|---------------|---------------|-------|

**`attendance`** — columns:
| Date | Event Name | Link | Roster |
|------|------------|------|--------|

**`settings`** — columns:
| Key | Value |
|-----|-------|

The `Roster` column in the attendance tab stores a JSON string with the full Raid Helper event data.

## Development

### Prerequisites
- Node.js (v18+)
- npm

### Getting Started

```bash
npm install
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Compile and launch the app |
| `npm run dev:watch` | Compile and launch with auto-reload on changes |
| `npm run build` | Compile TypeScript and bundle the renderer |
| `npm start` | Launch the app (requires a prior build) |
| `npm run dist` | Build and package a Windows installer |

### Tech Stack

- **Electron** — desktop application framework
- **TypeScript** — type-safe JavaScript
- **esbuild** — fast renderer bundling
- **ag-Grid** — data grid component
- **google-auth-library** — Google Sheets API authentication
- **electron-builder** — application packaging and distribution
- **electron-updater** — auto-update from GitHub releases
