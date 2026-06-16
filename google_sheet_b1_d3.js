#!/usr/bin/env node

/**
 * Read and print B1:D3 from a Google Sheets worksheet.
 *
 * Usage:
 *   GOOGLE_OAUTH_TOKEN="ya29..." node google_sheet_b1_d3.js "https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit?gid=<gid>"
 *
 * Notes:
 * - This uses the Google Sheets API, so you need a valid OAuth access token
 *   with spreadsheet read access.
 * - The worksheet is identified by `gid` from the URL, then mapped to its
 *   sheet title before reading the A1 range.
 */

function usage() {
  console.error(
    'Usage: GOOGLE_OAUTH_TOKEN="..." node google_sheet_b1_d3.js "<Google Sheets URL>"'
  );
}

function parseSpreadsheetUrl(input) {
  const text = String(input || "").trim();
  if (!text) return null;

  const spreadsheetIdMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  const spreadsheetId = spreadsheetIdMatch ? spreadsheetIdMatch[1] : text;

  const gidMatch = text.match(/[?#&]gid=(\d+)/i);
  const gid = gidMatch ? Number(gidMatch[1]) : null;

  return { spreadsheetId, gid };
}

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}${body ? `\n${body}` : ""}`
    );
  }

  return response.json();
}

async function main() {
  const inputUrl = process.argv[2];
  const token = process.env.GOOGLE_OAUTH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN || "";

  if (!inputUrl || !token) {
    usage();
    process.exitCode = 1;
    return;
  }

  const parsed = parseSpreadsheetUrl(inputUrl);
  if (!parsed || !parsed.spreadsheetId) {
    throw new Error("Unable to parse spreadsheet ID from the URL.");
  }
  if (parsed.gid === null) {
    throw new Error("Unable to parse gid from the URL.");
  }

  const metadataUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${parsed.spreadsheetId}`);
  metadataUrl.searchParams.set("fields", "sheets(properties(sheetId,title))");

  const metadata = await fetchJson(metadataUrl, token);
  const sheets = Array.isArray(metadata.sheets) ? metadata.sheets : [];
  const targetSheet = sheets.find((sheet) => sheet?.properties?.sheetId === parsed.gid);

  if (!targetSheet) {
    throw new Error(`No worksheet found for gid=${parsed.gid}.`);
  }

  const title = targetSheet.properties.title;
  const range = `${quoteSheetName(title)}!B1:D3`;
  const valuesUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${parsed.spreadsheetId}/values/${encodeURIComponent(range)}`
  );
  valuesUrl.searchParams.set("majorDimension", "ROWS");

  const valuesData = await fetchJson(valuesUrl, token);
  const values = Array.isArray(valuesData.values) ? valuesData.values : [];

  console.log(JSON.stringify({ spreadsheetId: parsed.spreadsheetId, gid: parsed.gid, title, range, values }, null, 2));
  if (values.length) {
    console.table(values);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
