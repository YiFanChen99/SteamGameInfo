import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Column, refreshReadColumns, type SheetRowValues } from '@watchlist/core';
import type { SheetApi } from '@watchlist/sheet-api';
import { describe, expect, it, vi } from 'vitest';

import { addGame, fetchSteamSnapshot, refreshGame, sheetApiRowStore, type SheetRowStore } from '../src';

const fixtures = join(import.meta.dirname, '../../core/test/fixtures');

/** Serves the core package's saved Steam responses for Slay the Spire 2. */
function fakeSteam(url: string): Promise<string> {
    if (url.startsWith('https://store.steampowered.com/app/2868840/')) {
        return Promise.resolve(readFileSync(join(fixtures, 'store/2868840.html'), 'utf8'));
    }
    if (url.startsWith('https://store.steampowered.com/appreviews/2868840?')) {
        return Promise.resolve(readFileSync(join(fixtures, 'appreviews/2868840.json'), 'utf8'));
    }
    return Promise.reject(new Error(`unexpected URL ${url}`));
}

function fakeStore(row: SheetRowValues) {
    const read = vi.fn<SheetRowStore['read']>(() => Promise.resolve(row));
    const write = vi.fn<SheetRowStore['write']>(() => Promise.resolve());
    const append = vi.fn<SheetRowStore['append']>(() => Promise.resolve());
    const store: SheetRowStore = { read, write, append };
    return { store, read, write, append };
}

describe('fetchSteamSnapshot', () => {
    it('combines the store page and reviews', async () => {
        const snapshot = await fetchSteamSnapshot(2868840, fakeSteam);

        expect(snapshot.page).toMatchObject({ name: 'Slay the Spire 2', originalPrice: 499, isEarlyAccess: true });
        expect(snapshot.reviews.positivePercent).toBe(61);
        expect(snapshot.playtime.medianHours).toEqual(expect.any(Number));
    });
});

describe('refreshGame', () => {
    it('writes merged updates back to the same app id and reports changes', async () => {
        const { store, read, write } = fakeStore({
            [Column.originalPrice]: 459,
            [Column.special]: '英 多人',
            [Column.detail]: '2026/3/5EA。中位1H，3rd.高2H。好評再買',
        });

        const { updates, changes } = await refreshGame(2868840, {
            fetchText: fakeSteam,
            store,
            now: () => new Date(2026, 9, 17),
        });

        expect(read).toHaveBeenCalledWith(2868840, refreshReadColumns);
        expect(write).toHaveBeenCalledWith(2868840, updates);
        expect(updates).toMatchObject({
            [Column.originalPrice]: 499,
            [Column.releaseDate]: '2026/3/5',
            [Column.reviewScore]: 61,
            [Column.updatedOn]: '2026/10/17',
            [Column.special]: '簡 多人',
        });
        expect(updates[Column.detail]).toMatch(/^2026\/3\/5EA。中位\d+H，3rd\.高\d+H。好評再買$/);
        expect(changes).toEqual([{ column: Column.originalPrice, oldValue: 459, newValue: 499, delta: 40 }]);
    });

    it('writes nothing when a fetch fails', async () => {
        const { store, write } = fakeStore({});
        const failing = () => Promise.reject(new Error('offline'));

        await expect(refreshGame(2868840, { fetchText: failing, store })).rejects.toThrow('offline');
        expect(write).not.toHaveBeenCalled();
    });
});

describe('addGame', () => {
    it('appends a full row with the lowest discount from the SteamDB block', async () => {
        const { store, append } = fakeStore({});

        const row = await addGame(2868840, {
            fetchText: fakeSteam,
            store,
            steamDbText: 'Lowest recorded price: NT$ 349',
            now: () => new Date(2026, 9, 17),
        });

        expect(append).toHaveBeenCalledWith(2868840, row);
        expect(row).toMatchObject({
            [Column.name]: '=HYPERLINK("https://store.steampowered.com/app/2868840/","Slay the Spire 2")',
            [Column.originalPrice]: 499,
            [Column.lowestOff]: 30,
            [Column.wantLevel]: '?',
            [Column.updatedOn]: '2026/10/17',
        });
    });
});

describe('sheetApiRowStore', () => {
    it('reads values and forwards writes to the web app', async () => {
        const api = {
            readRow: vi.fn(() => Promise.resolve({ row: 9, values: { [Column.special]: '英' } })),
            updateRow: vi.fn(() => Promise.resolve({ row: 9 })),
            appendRow: vi.fn(() => Promise.resolve({ row: 10 })),
        };
        const store = sheetApiRowStore(api as unknown as SheetApi);

        expect(await store.read(570, [Column.special])).toEqual({ [Column.special]: '英' });
        await store.write(570, { [Column.special]: '繁' });
        await store.append(571, { [Column.special]: 'X' });

        expect(api.readRow).toHaveBeenCalledWith(570, [Column.special]);
        expect(api.updateRow).toHaveBeenCalledWith(570, { [Column.special]: '繁' });
        expect(api.appendRow).toHaveBeenCalledWith(571, { [Column.special]: 'X' });
    });
});
