import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Column, type SheetRowValues } from '@watchlist/core';
import { describe, expect, it } from 'vitest';

import { addGame, refreshGame, type SheetRowStore } from '../src';

/**
 * What the Steam page buttons send to the web app for each saved fixture game
 * (see packages/core/test/fixtures/README.md). The snapshot file is the readable spec:
 * review it when the rules change.
 */
const fixtures = join(import.meta.dirname, '../../core/test/fixtures');
const appIds = [1145360, 1562430, 2868840, 1966720, 3669620, 570];
const today = new Date(2026, 9, 17);
const steamDbText = 'Lowest recorded price: NT$ 99';

/** Old row for the update case: placeholder price, hand-written tags and notes. */
const oldRow: SheetRowValues = {
    [Column.originalPrice]: 10000,
    [Column.releaseDate]: '2020/1/1',
    [Column.special]: '英 多人',
    [Column.detail]: '中位1H，3rd.高2H。等特價',
};

function fakeSteam(url: string): Promise<string> {
    const appId = /\/(?:app|appreviews)\/(\d+)/.exec(url)?.[1];
    const kind = url.includes('/appreviews/') ? 'appreviews' : 'store';
    const file = join(fixtures, kind, `${appId}.${kind === 'store' ? 'html' : 'json'}`);
    return Promise.resolve(readFileSync(file, 'utf8'));
}

function recordingStore() {
    const sent: { action: string; values: SheetRowValues }[] = [];
    const store: SheetRowStore = {
        read: () => Promise.resolve(oldRow),
        write: (_, values) => {
            sent.push({ action: 'update', values });
            return Promise.resolve();
        },
        append: (_, values) => {
            sent.push({ action: 'append', values });
            return Promise.resolve();
        },
    };
    return { store, sent };
}

describe.each(appIds)('app %i', (appId) => {
    it('＋ 新增 sends', async () => {
        const { store, sent } = recordingStore();
        await addGame(appId, { fetchText: fakeSteam, store, steamDbText, now: () => today });
        expect(sent).toMatchSnapshot();
    });

    it('↻ 更新 sends, and reports', async () => {
        const { store, sent } = recordingStore();
        const { changes } = await refreshGame(appId, { fetchText: fakeSteam, store, steamDbText, now: () => today });
        expect({ sent, changes }).toMatchSnapshot();
    });
});
