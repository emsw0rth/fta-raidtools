# Changelog

## v1.5.0

### New Features
- **Direct Raid Helper API control** - New attendance and roll-modifier flows pull events from your server via the Raid Helper API, with no more pasting URLs. Configure your Discord server ID, API key, and earliest-event date in Settings → General Settings
- **Event picker** - A searchable list of past events replaces the URL prompt; type to filter by name and a "Show already-imported" toggle hides events you've already processed
- **Import history tracking** - A new `rh-import-history` Google Sheet tab records every event imported (event ID, title, date, time, leader, channel, timestamp), driving the "imported" badge in the picker
- **Unknown Players section** - Sign-ups whose names don't match any roster member now appear in a dedicated section at the top of the attendance form with a roster dropdown, so pugs and new members can be credited correctly (or marked as not credited)
- **Settings sub-tabs** - Settings page reorganised into General Settings, Roll Modifier Settings, and Raid Settings (raid configs moved here from the Raid page)
- **Per-row delete on Previous Events** - Each previous attendance entry now has a × button that removes the row and persists the change to the Google Sheet

### Changes
- Attendance entry form now opens in a wide modal with a pinned Confirm & Award footer, scrollable body, and inline progress text
- Confirm & Award now writes the roster, attendance, and import-history sheets in parallel for noticeably faster saves
- Previous Events list is sorted newest-first (using the event's startTime when available) and capped at 45vh with a scrollbar
- Raid page is now just the Export Roll Modifiers tool — Raid Settings live in Settings

### Bug Fixes
- Errors during Confirm & Award are now surfaced inline in the modal footer instead of being silently swallowed

### Documentation
- User guide (https://emsw0rth.github.io/fta-raidtools/) refreshed for v1.5.0: Settings split into General / Roll Modifier / Raid Settings sub-tabs, Raid Helper setup walkthrough, event picker workflow, Unknown Players handling, and Previous Events deletion/sort
- New "For Raiders: Balanced Rolls Explained" section in the user guide aimed at guild members who don't use the app — covers how the in-game addons work, points awarded/deducted per raid, excused vs unexcused absence, the 0.75–1.75 cap, and worked examples

## v1.4.2

### Changes
- Removed global Balanced Roll Settings from the Settings page (new member value, award for completion, deduction on item win) — these values are now managed per-raid via the Raid Settings
- Renamed settings section to "Roll Modifier Settings" with only min/max rollModifier fields
- Fixed app header version display (was stuck on v1.3.0)

## v1.4.0

### New Features
- **Raid Settings Management** - New raid settings section on the Raid page with full CRUD support (add, delete, load/save to Google Sheets) powered by ag-grid
- **Raid Selection on Import** - Mandatory raid selection dropdown added to CSV import (Loot History) and attendance event entry dialogs
- **Did Not Sign Up Tracking** - New attendance section showing roster members who didn't sign up, with configurable per-raid deductions applied to roll modifiers

### Changes
- Item win deductions and max deduction caps are now per-raid instead of global settings
- Award for raid completion and absence deductions are now raid-specific
- Updated Raid Helper API endpoint from raid-helper.dev to raid-helper.xyz (v4), with backwards compatibility for both domains
- Google Sheets integration now clears existing data before writing to prevent stale rows
- New raid settings sheet support with headers: ID, name, award-for-completion, item-win-deduction, items-deduction-max, absence-unexcused, did-not-sign-up
- Modal dialogs now include a close button header and improved focus management
- Repository moved to github.com/emsw0rth/fta-raidtools

### Bug Fixes
- Fixed item win deduction logic to properly cap total deductions per player during import

## v1.3.1

- Patch release

## v1.3.0

- Feature release

## v1.2.0

- Feature release

## v1.1.0

- Feature release

## v1.0.0

- Initial release of FTA Raid Tools
