import type { FetchText } from '@watchlist/core';

/**
 * One row of the current whole-sheet dump, by column letter.
 * Kept as the annotator reads it until the query endpoint replaces the dump (see PLAN M1).
 */
export interface SheetDumpRow {
    /** Game name. May pack several aliases separated by `/`. */
    B: string;
    /** Update date, parseable by `new Date()`. Absent when never updated. */
    G?: string;
    /** How much the game is wanted. */
    K: string | number;
}

export interface SheetDump {
    games: SheetDumpRow[];
    labelMap: Record<string, unknown>;
}

export interface SheetApiOptions {
    /** The web app's `/exec` URL. Each Google account has its own deployment. */
    webAppUrl: string;
    /** Must send the Google login cookies; Apps Script redirects `/exec` to `script.googleusercontent.com`. */
    fetchText: FetchText;
}

export interface SheetApi {
    /** The whole sheet, as the current endpoint returns it. */
    fetchDump(): Promise<SheetDump>;
}

export function createSheetApi({ webAppUrl, fetchText }: SheetApiOptions): SheetApi {
    return {
        async fetchDump() {
            const body = await fetchText(webAppUrl);
            const data = JSON.parse(body) as Partial<SheetDump>;
            if (!Array.isArray(data.games)) {
                throw new Error('Sheet dump has no games array');
            }
            return { games: data.games, labelMap: data.labelMap ?? {} };
        },
    };
}
