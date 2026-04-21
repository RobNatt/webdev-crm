/** One CSV row split into fields (handles `"quoted, commas"`). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(raw: string): string {
  return raw
    .replace(/^\ufeff/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Parse CSV text into row objects with normalized snake_case keys (from headers).
 */
export function parseLeadsCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\ufeff/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows: Record<string, string>[] = [];

  for (let li = 1; li < lines.length; li++) {
    const values = parseCsvLine(lines[li]);
    if (values.length === 1 && values[0] === "") continue;
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = values[i] ?? "";
    });
    rows.push(rec);
  }
  return rows;
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]?.trim();
    if (v) return v;
  }
  return "";
}

/**
 * Map flexible export columns (Google Maps, spreadsheets, etc.) to API field names.
 */
export function mapCsvRowToApiLead(row: Record<string, string>): Record<string, string> {
  return {
    company_name: pick(
      row,
      "company_name",
      "companyname",
      "title",
      "name",
      "business_name",
      "business",
      "place_name",
      "placename",
      "label",
      "company"
    ),
    website: pick(row, "website", "url", "web_site", "web", "site"),
    location: pick(row, "location", "address", "full_address", "fulladdress", "street_address"),
    phone: pick(row, "phone", "phone_number", "phonenumber", "tel", "telephone", "mobile"),
    email: pick(row, "email", "e_mail", "e-mail"),
    owner_name: pick(row, "owner_name", "ownername", "contact_name", "contactname", "owner")
  };
}
