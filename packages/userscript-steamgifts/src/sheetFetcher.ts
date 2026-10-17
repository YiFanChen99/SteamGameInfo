import { withSheetApi } from './gm';
import type { SheetData } from './types';

const updateDurationMs = 24 * 60 * 60 * 1000; // 24 hours

const storageKey = 'ekkoGames';

function saveData(data: SheetData): void {
    localStorage.setItem(storageKey, JSON.stringify(data));
}

async function fetchData(): Promise<SheetData> {
    console.log('SteamGifts Annotator: fetchData starting ...');
    const dump = await withSheetApi(api => api.fetchDump());
    const data: SheetData = { ...dump, time: Date.now() };
    saveData(data);
    return data;
}

export async function getOrFetchData(): Promise<SheetData> {
    const old = localStorage.getItem(storageKey);
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

/**
 * After a refresh wrote 更新日, set it on the matching games of `data` in place and save,
 * so the annotation drops its old year without refetching the sheet. The fetch time is
 * kept, so the cache still expires on schedule.
 *
 * @param name The refreshed row's whole name cell, as the dump's `B` has it.
 * @returns Whether any game matched.
 */
export function markUpdated(data: SheetData, name: string, updatedOn: Date): boolean {
    const games = data.games.filter(game => game.B === name);
    for (const game of games) {
        // Same text the web app dumps.
        game.G = updatedOn.toDateString();
    }
    if (games.length) {
        saveData(data);
    }
    return games.length > 0;
}
