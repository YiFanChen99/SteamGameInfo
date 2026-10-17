import type { FetchText } from '@watchlist/core';

/**
 * One row of the whole-sheet dump, keyed by column letter to keep the payload small.
 */
export interface SheetDumpRow {
    /** Game name. May pack several aliases separated by `/`. */
    B: string;
    /** Update date, parseable by `new Date()`. Empty or absent when never updated. */
    G?: string;
    /** How much the game is wanted, or the owned mark taken from the AnyDeal column. */
    K: string | number;
}

export interface SheetDump {
    games: SheetDumpRow[];
    /** Header names of the returned columns, keyed by column letter. */
    labelMap: Record<string, unknown>;
}

/** Query parameter that carries the shared token. */
export const tokenParam = 'token';

/** Body the web app returns, with status 200, when the token is missing or wrong. */
export interface SheetApiErrorBody {
    error: 'unauthorized';
}

/** The token was missing or wrong; ask the user for it again. */
export class SheetApiUnauthorizedError extends Error {
    constructor() {
        super('Sheet API rejected the token');
        this.name = 'SheetApiUnauthorizedError';
    }
}

export interface SheetApiOptions {
    /** The web app's `/exec` URL. */
    webAppUrl: string;
    /** Shared secret stored in the web app's script properties. */
    token: string;
    /** Must follow redirects: Apps Script redirects `/exec` to `script.googleusercontent.com`. */
    fetchText: FetchText;
}

export interface SheetApi {
    /** The whole sheet, as the web app dumps it. */
    fetchDump(): Promise<SheetDump>;
}

export function createSheetApi({ webAppUrl, token, fetchText }: SheetApiOptions): SheetApi {
    const url = `${webAppUrl}?${tokenParam}=${encodeURIComponent(token)}`;
    return {
        async fetchDump() {
            const body = await fetchText(url);
            const data = JSON.parse(body) as Partial<SheetDump & SheetApiErrorBody>;
            if (data.error === 'unauthorized') {
                throw new SheetApiUnauthorizedError();
            }
            if (!Array.isArray(data.games)) {
                throw new Error('Sheet dump has no games array');
            }
            return { games: data.games, labelMap: data.labelMap ?? {} };
        },
    };
}
