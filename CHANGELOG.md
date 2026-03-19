# Changelog

## v1.2.0

### Added
- **Raid page**: Export roll modifiers for a Raid Helper event
  - Load a Raid Helper event URL and match sign-ups against the guild roster
  - View matched results with Name, Raid-Helper Name, Roll Modifier, and Event Sign-Up Name
  - Unmatched entries highlighted in red
  - "Export to clipboard" copies the data as formatted JSON for use in addons
- **Settings store**: Balanced Roll settings are now stored in a `settings` sheet tab and preloaded on app start
- **Balanced Roll settings** section on the Settings page:
  - New member value (default 1.0)
  - Award for raid completion (default 0.2)
  - Deduction on item win (default 0.1)
- **OS? and Deducted columns** in loot history — tracked in the store, grid UI, and sheet
- **CSV paste import**: "Import data" now opens a modal to paste CSV data directly instead of using a file picker

### Changed
- Attendance award default now reads from the "Award for raid completion" setting instead of hardcoded 0.2
- Loot history deduction on item win now reads from the "Deduction on item win" setting instead of hardcoded 0.2
- Loot history is now persisted to the sheet immediately after import
- Settings page Save button moved above the form sections
- Settings page and Raid page are now scrollable

## v1.1.0

### Added
- **Auto-update**: The app now checks GitHub for new releases on startup and prompts to download and install updates
- **Attendance page**: Load Raid Helper events, review sign-ups, and award roll modifier bonuses
  - Award column with configurable point values (default 0.2)
  - "Award to" column maps sign-ups to roster names
  - "Confirm & Award" applies bonuses to roster roll modifiers and saves to the sheet
  - Attendance history stored in the `attendance` sheet tab with date, event name, link, and full event data
  - Previous events list with clickable Raid Helper links
- **Data preloading**: All sheet tabs (loot history, roster, attendance) are fetched in the background at startup
- **Dev watch mode**: `npm run dev:watch` for auto-reload during development using concurrently and electronmon

### Changed
- Loot history and roster pages now subscribe to store updates instead of fetching on page creation
- Roster columns updated to include Raid-Helper name, Main, and Roll Modifier

## v1.0.0

- Initial release
- Loot history management with Google Sheets integration
- Guild roster management
- CSV import with duplicate detection
- Wowhead item tooltips
- Settings page for Google Sheet and service account configuration
