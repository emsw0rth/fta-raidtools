# FTA Raid Tools

Desktop application for managing raids, loot, and attendance for the WoW TBC Anniversary guild **From the Ashes**.

## Features

- **Direct Raid Helper integration** - Pull past events directly from your Discord server via the Raid Helper API; no copy-pasting URLs. Configurable earliest-event date filter.
- **Attendance tracking** - Auto-match sign-ups against the roster, dedicated section for unknown players (pugs / new members) with a roster picker, and per-raid awards and deductions
- **Loot history** - Import loot CSV with per-raid deduction tracking, off-spec exclusion, and maximum deduction caps per player per import
- **Roster management** - Maintain guild members with class, specs, professions, and roll modifiers
- **Per-raid settings** - Each raid has its own awards and deductions (Karazhan and Gruul's Lair use different values)
- **Google Sheets backend** - All persistent data lives in your guild's Google Sheet (roster, attendance, loot history, settings, raid configs, import history)
- **Auto-updates** - Automatic update notifications via GitHub Releases

## In-game Addons

The exported roll modifiers and loot history are consumed by two companion in-game addons developed alongside this tool:

- [Balanced Rolls](https://github.com/emsw0rth/balanced-rolls) - Multiplies in-game `/roll` results by each player's roll modifier (works alongside Gargul)
- [Gargul History](https://github.com/emsw0rth/gargul-history) - Tracks raid loot in-game for export back into FTA Raid Tools

## User Guide

For detailed usage instructions &mdash; including a raider-facing explanation of how Balanced Rolls work in-game &mdash; see the [User Guide](https://emsw0rth.github.io/fta-raidtools/).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Getting Started

### Prerequisites

- Node.js
- npm

### Development

```bash
npm install
npm run dev
```

### Watch Mode

```bash
npm run dev:watch
```

### Build

```bash
npm run build
npm run dist
```

## Tech Stack

- Electron
- TypeScript
- ag-grid-community
- electron-updater
- Google Auth Library
