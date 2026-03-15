import { LootEntry } from "../models/LootEntry";

export function parseLootCsv(csv: string): LootEntry[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header row
  return lines.slice(1).map((line) => {
    // Handle quoted CSV fields
    const fields = parseCsvLine(line);
    return {
      date: fields[0]?.trim() ?? "",
      player: fields[1]?.trim() ?? "",
      item: fields[2]?.trim() ?? "",
      itemId: fields[3] ? parseInt(fields[3].trim(), 10) || null : null,
    };
  });
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
