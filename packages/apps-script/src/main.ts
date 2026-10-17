/**
 * Entry points. scripts/build.mjs declares a global function for each export here,
 * because Apps Script only finds top-level function declarations.
 */
import { tokenParam, type SheetApiErrorBody } from '@watchlist/sheet-api';

import { createChunkedCache, type ChunkedCache } from './chunkedCache';
import { buildDump, firstColumn, lastColumn, worksheetName, type CellValue } from './dump';

/** Script property holding the shared token. Set it in Project Settings → Script Properties. */
const tokenProperty = 'API_TOKEN';

function dumpCache(): ChunkedCache {
    return createChunkedCache({
        store: CacheService.getScriptCache(),
        codec: {
            encode: text => Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(text)).getBytes()),
            decode: stored => Utilities.ungzip(
                Utilities.newBlob(Utilities.base64Decode(stored), 'application/x-gzip'),
            ).getDataAsString(),
        },
        key: 'dump:v1',
        chunkChars: 90_000,
        expirationInSeconds: 6 * 60 * 60,
    });
}

/** Fails closed: an unset token property rejects every request. */
export function isAuthorized(provided: string | undefined, expected: string | null): boolean {
    return Boolean(expected) && provided === expected;
}

function readDumpText(): string {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(worksheetName);
    if (!sheet) {
        throw new Error(`Worksheet ${worksheetName} not found`);
    }
    const header = sheet.getRange(`${firstColumn}1:${lastColumn}1`).getValues()[0] ?? [];
    const lastRow = sheet.getLastRow();
    const rows = lastRow < 2 ? [] : sheet.getRange(`${firstColumn}2:${lastColumn}${lastRow}`).getValues();
    return JSON.stringify(buildDump(header as CellValue[], rows as CellValue[][]));
}

function jsonOutput(text: string): GoogleAppsScript.Content.TextOutput {
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

export function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
    const expected = PropertiesService.getScriptProperties().getProperty(tokenProperty);
    if (!isAuthorized(e.parameter[tokenParam], expected)) {
        const body: SheetApiErrorBody = { error: 'unauthorized' };
        return jsonOutput(JSON.stringify(body));
    }

    const cache = dumpCache();
    let text = cache.get();
    if (text === null) {
        text = readDumpText();
        cache.put(text);
    }
    return jsonOutput(text);
}

/** Simple trigger: any hand edit may change the dump. Edits made by scripts do not fire it. */
export function onEdit(): void {
    dumpCache().invalidate();
}

/**
 * Sheet custom function kept from the original project: turns a row of the wishlist
 * into a row for the owned list.
 */
export function WantToOwned(records: unknown[][]): unknown[][] {
    const record = records[0] ?? [];
    return [[
        record[0], undefined, record[11], undefined, undefined, undefined, 'O',
        `${String(record[4])}，${String(record[12])}，${String(record[13])}`,
    ]];
}
