import { RosterEntry } from "../../models/RosterEntry";
import { AttendanceEntry } from "../../models/AttendanceEntry";
import { RaidSettingsEntry } from "../../models/RaidSettingsEntry";
import { RhImportHistoryEntry } from "../../models/RhImportHistoryEntry";
import { rosterStore } from "../../store/RosterStore";
import { attendanceStore } from "../../store/AttendanceStore";
import { settingsStore } from "../../store/SettingsStore";
import { raidSettingsStore } from "../../store/RaidSettingsStore";
import { rhImportHistoryStore } from "../../store/RhImportHistoryStore";
import { createRhEventPicker } from "../molecules/RhEventPicker";

const ROSTER_SHEET = "roster";
const ROSTER_HEADERS = ["Name", "Raid-Helper name", "Rank", "Class", "MS", "OS", "Main", "Profession 1", "Profession 2", "Roll Modifier", "Notes"];
const ATTENDANCE_SHEET = "attendance";
const ATTENDANCE_HEADERS = ["Date", "Event Name", "Link", "Roster"];
const RH_IMPORT_HISTORY_SHEET = "rh-import-history";
const RH_IMPORT_HISTORY_HEADERS = ["Event ID", "Title", "Date", "Time", "Leader", "Channel ID", "Imported At"];

function findRosterName(signUpName: string): string {
  const roster = rosterStore.getAll();
  const lower = signUpName.toLowerCase();

  // First check raidHelperName
  const byRaidHelper = roster.find((r) => r.raidHelperName.toLowerCase() === lower);
  if (byRaidHelper) return byRaidHelper.name;

  // Then check character name
  const byName = roster.find((r) => r.name.toLowerCase() === lower);
  if (byName) return byName.name;

  return "";
}

function roleSort(roleName: string | undefined): number {
  switch (roleName) {
    case "Tanks": return 0;
    case "Healers": return 1;
    case "Melee": return 2;
    case "Ranged": return 3;
    default: return 4;
  }
}

function showEventPicker(
  onSubmit: (event: RaidHelperServerEventListItem, raidSettings: RaidSettingsEntry) => void,
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal modal--wide";

  const title = document.createElement("h3");
  title.className = "modal__title";
  title.textContent = "New Attendance Entry";
  modal.appendChild(title);

  /* ── Raid dropdown ── */
  const raidField = document.createElement("div");
  raidField.className = "modal__field";

  const raidLabel = document.createElement("label");
  raidLabel.className = "modal__label";
  raidLabel.textContent = "Raid";

  const raidSelect = document.createElement("select");
  raidSelect.className = "modal__input";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Choose raid";
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  raidSelect.appendChild(defaultOpt);

  const raids = raidSettingsStore.getAll();
  for (const raid of raids) {
    const opt = document.createElement("option");
    opt.value = raid.id;
    opt.textContent = raid.name;
    raidSelect.appendChild(opt);
  }

  const raidError = document.createElement("div");
  raidError.className = "modal__error";
  raidError.style.display = "none";
  raidError.textContent = "Please select a raid before picking an event.";

  raidSelect.addEventListener("change", () => {
    raidError.style.display = "none";
  });

  raidField.appendChild(raidLabel);
  raidField.appendChild(raidSelect);
  raidField.appendChild(raidError);
  modal.appendChild(raidField);

  /* ── Event picker ── */
  const pickerLabel = document.createElement("label");
  pickerLabel.className = "modal__label";
  pickerLabel.textContent = "Select an event";
  modal.appendChild(pickerLabel);

  const picker = createRhEventPicker({
    onSelect: (ev) => {
      if (!raidSelect.value) {
        raidError.style.display = "block";
        raidSelect.focus();
        return;
      }
      const selectedRaid = raids.find((r) => r.id === raidSelect.value);
      if (!selectedRaid) return;
      overlay.remove();
      onSubmit(ev, selectedRaid);
    },
  });
  modal.appendChild(picker);

  const actions = document.createElement("div");
  actions.className = "modal__actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => overlay.remove());
  actions.appendChild(cancelBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  raidSelect.focus();
}

function buildAttendanceForm(
  event: RaidHelperEvent,
  eventId: string,
  raidSettings: RaidSettingsEntry,
  channelId: string,
  onSuccess: () => void,
): { body: HTMLElement; footer: HTMLElement } {
  const container = document.createElement("div");
  container.className = "attendance-form";

  // Event header
  const header = document.createElement("div");
  header.className = "attendance-header";

  const titleEl = document.createElement("h2");
  titleEl.className = "attendance-event-title";
  titleEl.textContent = event.title;

  const meta = document.createElement("div");
  meta.className = "attendance-meta";
  meta.textContent = `Date: ${event.date} | Time: ${event.time} | Leader: ${event.leaderName}`;

  header.appendChild(titleEl);
  header.appendChild(meta);
  container.appendChild(header);

  // Filter out absences and sort by role
  const allAttendees = event.signUps
    .filter((s) => s.className !== "Absence")
    .sort((a, b) => roleSort(a.roleName) - roleSort(b.roleName));

  // Split into matched (have a roster identity) and unknown (no roster match —
  // could be a pug, new member, or a typo in the sign-up name).
  const attendees = allAttendees.filter((s) => findRosterName(s.name) !== "");
  const unknownAttendees = allAttendees.filter((s) => findRosterName(s.name) === "");

  const absences = event.signUps.filter((s) => s.className === "Absence");

  // Attendee list
  const list = document.createElement("div");
  list.className = "attendance-list";

  const listHeader = document.createElement("div");
  listHeader.className = "attendance-row attendance-row--header";
  listHeader.innerHTML =
    `<span class="attendance-col attendance-col--name">Name</span>` +
    `<span class="attendance-col attendance-col--class">Class</span>` +
    `<span class="attendance-col attendance-col--spec">Spec</span>` +
    `<span class="attendance-col attendance-col--role">Role</span>` +
    `<span class="attendance-col attendance-col--points">Award</span>` +
    `<span class="attendance-col attendance-col--award">Award to</span>` +
    `<span class="attendance-col attendance-col--check">Attended</span>`;
  list.appendChild(listHeader);

  attendees.forEach((signUp) => {
    const row = document.createElement("label");
    row.className = "attendance-row";

    const name = document.createElement("span");
    name.className = "attendance-col attendance-col--name";
    name.textContent = signUp.name;

    const cls = document.createElement("span");
    cls.className = "attendance-col attendance-col--class";
    cls.textContent = signUp.className ?? "";

    const spec = document.createElement("span");
    spec.className = "attendance-col attendance-col--spec";
    spec.textContent = signUp.specName ?? "";

    const role = document.createElement("span");
    role.className = "attendance-col attendance-col--role";
    role.textContent = signUp.roleName ?? "";

    const pointsWrap = document.createElement("span");
    pointsWrap.className = "attendance-col attendance-col--points";
    const pointsInput = document.createElement("input");
    pointsInput.type = "text";
    pointsInput.className = "attendance-points-input";
    pointsInput.value = raidSettings.awardForCompletion || "0";
    pointsInput.addEventListener("click", (e) => e.preventDefault());
    pointsWrap.appendChild(pointsInput);

    const awardWrap = document.createElement("span");
    awardWrap.className = "attendance-col attendance-col--award";
    const awardInput = document.createElement("input");
    awardInput.type = "text";
    awardInput.className = "attendance-award-input";
    awardInput.value = findRosterName(signUp.name);
    awardInput.addEventListener("click", (e) => e.preventDefault());
    awardWrap.appendChild(awardInput);

    const checkWrap = document.createElement("span");
    checkWrap.className = "attendance-col attendance-col--check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.className = "attendance-checkbox";
    checkbox.dataset.userId = signUp.userId;
    checkbox.dataset.name = signUp.name;
    checkWrap.appendChild(checkbox);

    row.appendChild(name);
    row.appendChild(cls);
    row.appendChild(spec);
    row.appendChild(role);
    row.appendChild(pointsWrap);
    row.appendChild(awardWrap);
    row.appendChild(checkWrap);
    list.appendChild(row);
  });

  // Unknown players section — sign-ups whose name didn't match any roster entry.
  // Rendered above the matched attendees list so the rows that need user action are
  // immediately visible.
  const unknownList = document.createElement("div");
  unknownList.className = "attendance-list";

  if (unknownAttendees.length > 0) {
    const unknownSection = document.createElement("div");
    unknownSection.className = "attendance-absences attendance-absences--top";

    const unknownTitle = document.createElement("h3");
    unknownTitle.className = "attendance-absences-title";
    unknownTitle.textContent = `Unknown players (${unknownAttendees.length})`;
    unknownSection.appendChild(unknownTitle);

    const unknownHint = document.createElement("p");
    unknownHint.className = "attendance-unknown-hint";
    unknownHint.textContent =
      "These sign-ups didn't match any roster member. Pick a roster member to credit, or leave \"don't credit\" for pugs / new members.";
    unknownSection.appendChild(unknownHint);

    const unknownHeader = document.createElement("div");
    unknownHeader.className = "attendance-row attendance-row--header";
    unknownHeader.innerHTML =
      `<span class="attendance-col attendance-col--name">Sign-up Name</span>` +
      `<span class="attendance-col attendance-col--class">Class</span>` +
      `<span class="attendance-col attendance-col--spec">Spec</span>` +
      `<span class="attendance-col attendance-col--role">Role</span>` +
      `<span class="attendance-col attendance-col--points">Award</span>` +
      `<span class="attendance-col attendance-col--award">Credit to</span>` +
      `<span class="attendance-col attendance-col--check">Attended</span>`;
    unknownList.appendChild(unknownHeader);

    const rosterSorted = rosterStore.getAll().slice().sort((a, b) => a.name.localeCompare(b.name));

    unknownAttendees.forEach((signUp) => {
      const row = document.createElement("label");
      row.className = "attendance-row attendance-row--unknown";

      const name = document.createElement("span");
      name.className = "attendance-col attendance-col--name";
      name.textContent = signUp.name;

      const cls = document.createElement("span");
      cls.className = "attendance-col attendance-col--class";
      cls.textContent = signUp.className ?? "";

      const spec = document.createElement("span");
      spec.className = "attendance-col attendance-col--spec";
      spec.textContent = signUp.specName ?? "";

      const role = document.createElement("span");
      role.className = "attendance-col attendance-col--role";
      role.textContent = signUp.roleName ?? "";

      const pointsWrap = document.createElement("span");
      pointsWrap.className = "attendance-col attendance-col--points";
      const pointsInput = document.createElement("input");
      pointsInput.type = "text";
      pointsInput.className = "attendance-points-input";
      pointsInput.value = raidSettings.awardForCompletion || "0";
      pointsInput.addEventListener("click", (e) => e.preventDefault());
      pointsWrap.appendChild(pointsInput);

      const awardWrap = document.createElement("span");
      awardWrap.className = "attendance-col attendance-col--award";
      const awardSelect = document.createElement("select");
      awardSelect.className = "attendance-award-input";
      awardSelect.addEventListener("click", (e) => e.preventDefault());
      const noneOpt = document.createElement("option");
      noneOpt.value = "";
      noneOpt.textContent = "(don't credit)";
      awardSelect.appendChild(noneOpt);
      for (const member of rosterSorted) {
        const opt = document.createElement("option");
        opt.value = member.name;
        opt.textContent = member.name;
        awardSelect.appendChild(opt);
      }
      awardWrap.appendChild(awardSelect);

      const checkWrap = document.createElement("span");
      checkWrap.className = "attendance-col attendance-col--check";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.className = "attendance-checkbox";
      checkbox.dataset.userId = signUp.userId;
      checkbox.dataset.name = signUp.name;
      checkWrap.appendChild(checkbox);

      row.appendChild(name);
      row.appendChild(cls);
      row.appendChild(spec);
      row.appendChild(role);
      row.appendChild(pointsWrap);
      row.appendChild(awardWrap);
      row.appendChild(checkWrap);
      unknownList.appendChild(row);
    });

    unknownSection.appendChild(unknownList);
    container.appendChild(unknownSection);
  }

  container.appendChild(list);

  // Show absences section
  if (absences.length > 0) {
    const absSection = document.createElement("div");
    absSection.className = "attendance-absences";

    const absTitle = document.createElement("h3");
    absTitle.className = "attendance-absences-title";
    absTitle.textContent = `Absences (${absences.length})`;
    absSection.appendChild(absTitle);

    const absNames = document.createElement("div");
    absNames.className = "attendance-absences-list";
    absNames.textContent = absences.map((s) => s.name).join(", ");
    absSection.appendChild(absNames);

    container.appendChild(absSection);
  }

  // Build set of all roster names that participated in the event (attendees + absences)
  const allSignUpNames = new Set<string>();
  for (const s of event.signUps) {
    const rosterName = findRosterName(s.name);
    if (rosterName) allSignUpNames.add(rosterName.toLowerCase());
  }

  // Find roster members who did not sign up at all
  const roster = rosterStore.getAll();
  const notSignedUp = roster.filter((r) => r.name && !allSignUpNames.has(r.name.toLowerCase()));

  // "Did not sign up" section
  const dnsSection = document.createElement("div");
  dnsSection.className = "attendance-absences";

  const dnsTitle = document.createElement("h3");
  dnsTitle.className = "attendance-absences-title";
  dnsTitle.textContent = `Did not sign up (${notSignedUp.length})`;
  dnsSection.appendChild(dnsTitle);

  const dnsList = document.createElement("div");
  dnsList.className = "attendance-list";

  const dnsHeader = document.createElement("div");
  dnsHeader.className = "attendance-row attendance-row--header";
  dnsHeader.innerHTML =
    `<span class="attendance-col attendance-col--name">Name</span>` +
    `<span class="attendance-col attendance-col--points">Deduction</span>` +
    `<span class="attendance-col attendance-col--check">Apply</span>`;
  dnsList.appendChild(dnsHeader);

  const didNotSignUpDeduction = raidSettings.didNotSignUp || "0";

  for (const member of notSignedUp) {
    const row = document.createElement("label");
    row.className = "attendance-row attendance-row--dns";

    const nameCol = document.createElement("span");
    nameCol.className = "attendance-col attendance-col--name";
    nameCol.textContent = member.name;

    const deductWrap = document.createElement("span");
    deductWrap.className = "attendance-col attendance-col--points";
    const deductInput = document.createElement("input");
    deductInput.type = "text";
    deductInput.className = "attendance-points-input";
    deductInput.value = `-${didNotSignUpDeduction}`;
    deductInput.addEventListener("click", (e) => e.preventDefault());
    deductWrap.appendChild(deductInput);

    const checkWrap = document.createElement("span");
    checkWrap.className = "attendance-col attendance-col--check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.className = "attendance-dns-checkbox";
    checkbox.dataset.rosterName = member.name;
    checkWrap.appendChild(checkbox);

    row.appendChild(nameCol);
    row.appendChild(deductWrap);
    row.appendChild(checkWrap);
    dnsList.appendChild(row);
  }

  dnsSection.appendChild(dnsList);
  container.appendChild(dnsSection);

  // Footer with spinner and confirm button (returned separately so the modal can pin it).
  const footer = document.createElement("div");
  footer.className = "attendance-footer";

  const footerSpinner = document.createElement("div");
  footerSpinner.className = "attendance-footer-spinner";
  footerSpinner.style.display = "none";
  footerSpinner.innerHTML = '<div class="spinner"></div>';
  footer.appendChild(footerSpinner);

  const footerStatus = document.createElement("span");
  footerStatus.className = "attendance-footer-status";
  footer.appendChild(footerStatus);

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn btn--primary";
  confirmBtn.textContent = "Confirm & Award";
  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    footerSpinner.style.display = "flex";
    footerStatus.classList.remove("attendance-footer-status--error");
    footerStatus.textContent = "";

    let succeeded = false;
    try {
      await confirmAndAward([list, unknownList], dnsList, event, eventId, channelId, (msg) => {
        footerStatus.textContent = msg;
      });
      succeeded = true;
    } catch (err) {
      footerStatus.textContent = `Failed: ${err instanceof Error ? err.message : String(err)}`;
      footerStatus.classList.add("attendance-footer-status--error");
    } finally {
      confirmBtn.disabled = false;
      footerSpinner.style.display = "none";
    }
    if (succeeded) onSuccess();
  });
  footer.appendChild(confirmBtn);

  return { body: container, footer };
}

function buildImportHistoryWrite(eventId: string, event: RaidHelperEvent, channelId: string): Promise<void> | null {
  if (rhImportHistoryStore.hasEvent(eventId)) return null;

  const entry: RhImportHistoryEntry = {
    eventId,
    title: event.title ?? "",
    date: event.date ?? "",
    time: event.time ?? "",
    leaderName: event.leaderName ?? "",
    channelId: channelId ?? "",
    importedAt: new Date().toISOString(),
  };
  rhImportHistoryStore.add(entry);

  const all = rhImportHistoryStore.getAll();
  const rows = all.map((e) => [e.eventId, e.title, e.date, e.time, e.leaderName, e.channelId, e.importedAt]);
  return window.api.writeSheet(RH_IMPORT_HISTORY_SHEET, [RH_IMPORT_HISTORY_HEADERS, ...rows]);
}

async function confirmAndAward(
  attendanceLists: HTMLElement[],
  dnsList: HTMLElement,
  event: RaidHelperEvent,
  eventId: string,
  channelId: string,
  onProgress: (msg: string) => void = () => {},
): Promise<void> {
  const roster = rosterStore.getAll();
  const rosterByName = new Map<string, RosterEntry>();
  for (const entry of roster) {
    rosterByName.set(entry.name.toLowerCase(), entry);
  }

  const notFound: string[] = [];
  const rows: Element[] = [];
  for (const l of attendanceLists) {
    rows.push(...Array.from(l.querySelectorAll(".attendance-row:not(.attendance-row--header)")));
  }

  for (const row of rows) {
    const checkbox = row.querySelector(".attendance-checkbox") as HTMLInputElement | null;
    if (!checkbox?.checked) continue;

    const awardToInput = row.querySelector(".attendance-award-input") as HTMLInputElement | HTMLSelectElement | null;
    const pointsInput = row.querySelector(".attendance-points-input") as HTMLInputElement | null;
    const awardTo = awardToInput?.value.trim() ?? "";
    const points = parseFloat(pointsInput?.value ?? "0") || 0;

    if (!awardTo) {
      // Unknown rows where the user explicitly chose "don't credit" are intentional
      // (pug / new member) — skip silently. Empty matched rows still warn.
      if (!row.classList.contains("attendance-row--unknown")) {
        const signUpName = row.querySelector(".attendance-col--name")?.textContent ?? "Unknown";
        notFound.push(signUpName);
      }
      continue;
    }

    const rosterEntry = rosterByName.get(awardTo.toLowerCase());
    if (!rosterEntry) {
      notFound.push(awardTo);
      continue;
    }

    const currentMod = parseFloat(rosterEntry.rollModifier) || 0;
    let newMod = parseFloat((currentMod + points).toFixed(4));
    const maxRollMod = parseFloat(settingsStore.get("Maximum rollModifier"));
    if (!isNaN(maxRollMod) && newMod > maxRollMod) {
      newMod = maxRollMod;
    }
    rosterEntry.rollModifier = String(newMod);
  }

  // Apply "did not sign up" deductions
  const dnsRows = Array.from(dnsList.querySelectorAll(".attendance-row--dns"));
  for (const row of dnsRows) {
    const checkbox = row.querySelector(".attendance-dns-checkbox") as HTMLInputElement | null;
    if (!checkbox?.checked) continue;

    const rosterName = checkbox.dataset.rosterName ?? "";
    const pointsInput = row.querySelector(".attendance-points-input") as HTMLInputElement | null;
    const deduction = parseFloat(pointsInput?.value ?? "0") || 0;

    const rosterEntry = rosterByName.get(rosterName.toLowerCase());
    if (!rosterEntry) continue;

    const currentMod = parseFloat(rosterEntry.rollModifier) || 0;
    let newMod = parseFloat((currentMod + deduction).toFixed(4));
    const minRollMod = parseFloat(settingsStore.get("Minimum rollModifier"));
    if (!isNaN(minRollMod) && newMod < minRollMod) {
      newMod = minRollMod;
    }
    rosterEntry.rollModifier = String(newMod);
  }

  // Build payloads for all sheet writes up front so they can run in parallel.
  rosterStore.replaceAll(roster);
  const rosterRows = roster.map((e) => [
    e.name, e.raidHelperName, e.rank, e.class, e.ms, e.os, e.main, e.profession1, e.profession2, e.rollModifier, e.notes,
  ]);

  const link = `https://raid-helper.dev/event/${eventId}`;
  const attendanceEntry: AttendanceEntry = {
    date: event.date,
    eventName: event.title,
    link,
    roster: JSON.stringify(event),
  };
  attendanceStore.add(attendanceEntry);

  const allEntries = attendanceStore.getAll();
  const attendanceRows = allEntries.map((e) => [e.date, e.eventName, e.link, e.roster]);

  const importHistoryWrite = buildImportHistoryWrite(eventId, event, channelId);

  onProgress("Saving roster, attendance, and history...");

  // Each writeSheet does its own auth + clear + PUT, so running them in parallel
  // cuts wall time by ~3x. Roster + attendance must succeed; history is best-effort
  // because the tab may not exist yet on first use.
  const [rosterResult, attendanceResult, historyResult] = await Promise.allSettled([
    window.api.writeSheet(ROSTER_SHEET, [ROSTER_HEADERS, ...rosterRows]),
    window.api.writeSheet(ATTENDANCE_SHEET, [ATTENDANCE_HEADERS, ...attendanceRows]),
    importHistoryWrite ?? Promise.resolve(),
  ]);

  if (rosterResult.status === "rejected") throw rosterResult.reason;
  if (attendanceResult.status === "rejected") throw attendanceResult.reason;
  if (historyResult.status === "rejected") {
    console.error("Failed to record rh-import-history:", historyResult.reason);
  }

  onProgress("Done.");

  if (notFound.length > 0) {
    alert(
      `Awards saved, but the following names were not found in the roster:\n\n` +
      notFound.map((n) => `  - ${n}`).join("\n")
    );
  }
}

async function deleteHistoryEntry(index: number): Promise<void> {
  const entry = attendanceStore.getAll()[index];
  if (!entry) return;

  const ok = confirm(`Delete attendance entry "${entry.eventName}" (${entry.date})?\n\nThis cannot be undone.`);
  if (!ok) return;

  attendanceStore.removeAt(index);

  const remaining = attendanceStore.getAll();
  const rows = remaining.map((e) => [e.date, e.eventName, e.link, e.roster]);
  try {
    await window.api.writeSheet(ATTENDANCE_SHEET, [ATTENDANCE_HEADERS, ...rows]);
  } catch (err) {
    attendanceStore.add(entry);
    alert(`Failed to delete: ${err instanceof Error ? err.message : err}`);
  }
}

function getEntrySortKey(entry: AttendanceEntry, fallbackIndex: number): number {
  // Prefer the event's startTime from the stored roster JSON since the `date`
  // field is a raw display string with unpredictable format. Fall back to a
  // best-effort Date.parse, then to insertion order so unparseable entries keep
  // a stable place at the bottom.
  try {
    const parsed = JSON.parse(entry.roster);
    if (typeof parsed.startTime === "number" && parsed.startTime > 0) {
      return parsed.startTime;
    }
  } catch { /* not JSON, fall through */ }

  const dateMs = Date.parse(entry.date);
  if (!isNaN(dateMs)) return Math.floor(dateMs / 1000);

  return fallbackIndex;
}

function buildHistoryList(container: HTMLElement): void {
  container.innerHTML = "";

  const entries = attendanceStore.getAll();
  if (entries.length === 0) return;

  const sorted = entries
    .map((entry, originalIndex) => ({ entry, originalIndex, sortKey: getEntrySortKey(entry, originalIndex) }))
    .sort((a, b) => b.sortKey - a.sortKey);

  const title = document.createElement("h3");
  title.className = "attendance-history-title";
  title.textContent = "Previous Events";
  container.appendChild(title);

  const table = document.createElement("div");
  table.className = "attendance-history";

  const header = document.createElement("div");
  header.className = "attendance-history-row attendance-history-row--header";
  header.innerHTML =
    `<span class="attendance-history-col attendance-history-col--date">Date</span>` +
    `<span class="attendance-history-col attendance-history-col--name">Event Name</span>` +
    `<span class="attendance-history-col attendance-history-col--link">Link</span>` +
    `<span class="attendance-history-col attendance-history-col--actions"></span>`;
  table.appendChild(header);

  sorted.forEach(({ entry, originalIndex }) => {
    const row = document.createElement("div");
    row.className = "attendance-history-row";

    const date = document.createElement("span");
    date.className = "attendance-history-col attendance-history-col--date";
    date.textContent = entry.date;

    const name = document.createElement("span");
    name.className = "attendance-history-col attendance-history-col--name";
    name.textContent = entry.eventName;

    const linkCol = document.createElement("span");
    linkCol.className = "attendance-history-col attendance-history-col--link";
    const anchor = document.createElement("a");
    anchor.href = entry.link;
    anchor.textContent = entry.link;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(entry.link, "_blank");
    });
    linkCol.appendChild(anchor);

    const actions = document.createElement("span");
    actions.className = "attendance-history-col attendance-history-col--actions";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "attendance-history-delete";
    deleteBtn.type = "button";
    deleteBtn.title = "Delete entry";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async () => {
      deleteBtn.disabled = true;
      try {
        await deleteHistoryEntry(originalIndex);
      } finally {
        deleteBtn.disabled = false;
      }
    });
    actions.appendChild(deleteBtn);

    row.appendChild(date);
    row.appendChild(name);
    row.appendChild(linkCol);
    row.appendChild(actions);
    table.appendChild(row);
  });

  container.appendChild(table);
}

function showAttendanceFormModal(eventId: string, raidSettings: RaidSettingsEntry, channelId: string): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal modal--xwide";

  const titleRow = document.createElement("div");
  titleRow.className = "modal__header";

  const title = document.createElement("h3");
  title.className = "modal__title";
  title.textContent = "New Attendance Entry";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal__close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());

  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);
  modal.appendChild(titleRow);

  const body = document.createElement("div");
  body.className = "modal__body";
  modal.appendChild(body);

  const spinner = document.createElement("div");
  spinner.className = "attendance-loading";
  spinner.innerHTML = '<div class="spinner"></div><span>Loading event data...</span>';
  body.appendChild(spinner);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  window.api.fetchRaidHelperEvent(eventId).then((event) => {
    body.innerHTML = "";
    const { body: formBody, footer } = buildAttendanceForm(
      event,
      eventId,
      raidSettings,
      channelId,
      () => overlay.remove(),
    );
    body.appendChild(formBody);
    modal.appendChild(footer);
  }).catch((err) => {
    body.innerHTML = "";
    const errEl = document.createElement("div");
    errEl.className = "attendance-error";
    errEl.textContent = `Failed to load event: ${err instanceof Error ? err.message : err}`;
    body.appendChild(errEl);
  });
}

export function createAttendancePage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "page attendance-page";

  const toolbar = document.createElement("div");
  toolbar.className = "loot-history-toolbar";

  const newEntryBtn = document.createElement("button");
  newEntryBtn.className = "btn btn--primary";
  newEntryBtn.textContent = "New Entry";

  toolbar.appendChild(newEntryBtn);
  page.appendChild(toolbar);

  const historyContainer = document.createElement("div");
  historyContainer.className = "attendance-history-container";
  page.appendChild(historyContainer);

  // Render history list and subscribe for updates
  buildHistoryList(historyContainer);
  attendanceStore.subscribe(() => buildHistoryList(historyContainer));

  newEntryBtn.addEventListener("click", () => {
    showEventPicker((pickedEvent, raidSettings) => {
      const eventId = String(pickedEvent.id ?? "");
      const channelId = String(pickedEvent.channelId ?? "");
      showAttendanceFormModal(eventId, raidSettings, channelId);
    });
  });

  return page;
}
