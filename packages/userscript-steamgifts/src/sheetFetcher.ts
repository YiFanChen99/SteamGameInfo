import type { FetchText } from '@watchlist/core';
import { createSheetApi, deployedWebAppUrl, SheetApiUnauthorizedError } from '@watchlist/sheet-api';

import type { SheetData } from './types';

const updateDurationMs = 24 * 60 * 60 * 1000; // 24 hours

/** Tampermonkey storage key of the token the web app checks. */
const tokenKey = 'sheetApiToken';

const fetchText: FetchText = url => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: (response) => {
            if (response.status < 200 || response.status >= 300) {
                reject(new Error(`Failed to fetch ${url}: ${response.status}`));
                return;
            }
            resolve(response.responseText);
        },
        onerror: (error) => {
            reject(new Error(`Failed to fetch ${url}: ${error.error}`));
        },
    });
});

/**
 * @returns The saved token, or one the user enters now; null when they cancel.
 */
function getToken(): string | null {
    const saved = GM_getValue<string>(tokenKey, '');
    if (saved) {
        return saved;
    }
    const entered = window.prompt('SteamGifts Annotator: 請輸入 Sheet API 的 token（Apps Script 的 API_TOKEN）')?.trim();
    if (!entered) {
        return null;
    }
    GM_setValue(tokenKey, entered);
    return entered;
}

async function fetchData(): Promise<SheetData> {
    console.log('SteamGifts Annotator: fetchData starting ...');
    // A rejected token is forgotten and asked for once more.
    for (let attempt = 1; ; attempt++) {
        const token = getToken();
        if (!token) {
            throw new Error('SteamGifts Annotator: no Sheet API token');
        }
        try {
            const dump = await createSheetApi({ webAppUrl: deployedWebAppUrl, token, fetchText }).fetchDump();
            const data: SheetData = { ...dump, time: Date.now() };
            localStorage.setItem('ekkoGames', JSON.stringify(data));
            return data;
        } catch (error) {
            if (!(error instanceof SheetApiUnauthorizedError)) {
                throw error;
            }
            GM_deleteValue(tokenKey);
            if (attempt >= 2) {
                throw error;
            }
        }
    }
}

export async function getOrFetchData(): Promise<SheetData> {
    const old = localStorage.getItem('ekkoGames');
    if (old) {
        const record = JSON.parse(old) as SheetData;
        const diffMs = Date.now() - record.time;
        if (diffMs > updateDurationMs) {
            return await fetchData();
        } else {
            return record;
        }
    } else {
        return await fetchData();
    }
}
