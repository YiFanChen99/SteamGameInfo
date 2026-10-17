import type { SteamSnapshot, StorePageInfo } from '@watchlist/steam-info-scraper';
import { describe, expect, it } from 'vitest';

import { buildDetail, Column, mergeDetail, mergeSpecial, planRefresh, type PlaytimeStats } from '../src';

const page: StorePageInfo = {
    name: 'Slay the Spire 2',
    originalPrice: 499,
    releaseDate: { text: '2026 年 3 月 5 日', date: { year: 2026, month: 3, day: 5 } },
    isEarlyAccess: true,
    hasDemo: false,
    interfaceLanguages: ['簡體中文', '英文'],
    tags: [],
};
const playtime: PlaytimeStats = { medianHours: 125, thirdHighestHours: 725 };
const snapshot: SteamSnapshot = {
    page,
    reviews: { totalPositive: 61, totalReviews: 100, playtimeMinutes: [1, 2, 3, 125, 725, 800, 900].map(hours => hours * 60) },
};
const today = new Date(2026, 9, 17);

describe('buildDetail', () => {
    it('writes the early access date and playtime', () => {
        expect(buildDetail(page, playtime)).toBe('2026/3/5EA。中位125H，3rd.高725H。');
    });

    it('omits the early access part and marks unknown numbers', () => {
        const released: StorePageInfo = { ...page, isEarlyAccess: false };
        expect(buildDetail(released, { medianHours: 3, thirdHighestHours: null })).toBe('中位3H，3rd.高-H。');
    });
});

describe('mergeDetail', () => {
    it('replaces only the playtime part, keeping hand-written notes', () => {
        expect(mergeDetail('2026/3/5EA。中位40H，3rd.高300H。等正式版', playtime))
            .toBe('2026/3/5EA。中位125H，3rd.高725H。等正式版');
    });

    it('replaces NaN values left by the legacy scraper', () => {
        expect(mergeDetail('英。中位NaNH，3rd.高NaNH。', playtime)).toBe('英。中位125H，3rd.高725H。');
    });

    it('appends playtime when the cell has none', () => {
        expect(mergeDetail('等正式版。', playtime)).toBe('等正式版。中位125H，3rd.高725H。');
    });
});

describe('mergeSpecial', () => {
    it('builds the language mark and Demo tag for a blank cell', () => {
        expect(mergeSpecial('', { ...page, interfaceLanguages: ['繁體中文'], hasDemo: true })).toBe('繁 Demo');
        expect(mergeSpecial('', { ...page, interfaceLanguages: ['日文'] })).toBe('X');
    });

    it('replaces the language mark and keeps hand-written tags', () => {
        expect(mergeSpecial('英 多人', page)).toBe('簡 多人');
        expect(mergeSpecial('無', page)).toBe('簡');
    });

    it('drops Demo once the page has none', () => {
        expect(mergeSpecial('簡 Demo', page)).toBe('簡');
    });

    it('keeps the old language mark when the page has no language table', () => {
        expect(mergeSpecial('繁', { ...page, interfaceLanguages: null })).toBe('繁');
        expect(mergeSpecial('', { ...page, interfaceLanguages: null })).toBe('!');
    });
});

describe('planRefresh', () => {
    it('replaces Steam-owned values and merges the tag and detail cells', () => {
        const oldRow = {
            [Column.originalPrice]: 499,
            [Column.releaseDate]: '2026/3/5',
            [Column.special]: '簡',
            [Column.detail]: '2026/3/5EA。中位40H，3rd.高300H。',
        };
        expect(planRefresh(snapshot, oldRow, today)).toEqual({
            updates: {
                [Column.originalPrice]: 499,
                [Column.releaseDate]: '2026/3/5',
                [Column.reviewScore]: 61,
                [Column.updatedOn]: '2026/10/17',
                [Column.special]: '簡',
                [Column.detail]: '2026/3/5EA。中位125H，3rd.高725H。',
            },
            changes: [],
        });
    });

    it('fills blank cells without reporting them as changes', () => {
        const { updates, changes } = planRefresh(snapshot, { [Column.detail]: '  ' }, today);

        expect(updates[Column.special]).toBe('簡');
        expect(updates[Column.detail]).toBe('2026/3/5EA。中位125H，3rd.高725H。');
        expect(changes).toEqual([]);
    });

    it('reports price and release date changes with their deltas', () => {
        const oldRow = { [Column.originalPrice]: '459', [Column.releaseDate]: '2026/2/26' };

        expect(planRefresh(snapshot, oldRow, today).changes).toEqual([
            { column: Column.originalPrice, oldValue: '459', newValue: 499, delta: 40 },
            { column: Column.releaseDate, oldValue: '2026/2/26', newValue: '2026/3/5', delta: 7 },
        ]);
    });

    it('treats the same date in another format as unchanged', () => {
        const oldRow = { [Column.releaseDate]: '2026 年 3 月 5 日' };
        expect(planRefresh(snapshot, oldRow, today).changes).toEqual([]);
    });

    it('reports a change without delta when the old date is not a full date', () => {
        const oldRow = { [Column.releaseDate]: '2026 年第一季' };
        expect(planRefresh(snapshot, oldRow, today).changes).toEqual([
            { column: Column.releaseDate, oldValue: '2026 年第一季', newValue: '2026/3/5', delta: null },
        ]);
    });

    it('writes the lowest discount only when one is given', () => {
        expect(planRefresh(snapshot, {}, today, { lowestOff: 30 }).updates[Column.lowestOff]).toBe(30);
        expect(planRefresh(snapshot, {}, today, { lowestOff: '-' }).updates[Column.lowestOff]).toBe('-');
        expect(planRefresh(snapshot, {}, today, { lowestOff: null }).updates).not.toHaveProperty(Column.lowestOff);
        expect(planRefresh(snapshot, {}, today).updates).not.toHaveProperty(Column.lowestOff);
    });

    it('replaces the unknown price placeholder without reporting a change', () => {
        const { updates, changes } = planRefresh(snapshot, { [Column.originalPrice]: 10000 }, today);

        expect(updates[Column.originalPrice]).toBe(499);
        expect(changes).toEqual([]);
    });

    it('leaves cells alone when Steam has no value', () => {
        const unreleased: SteamSnapshot = {
            page: { ...page, originalPrice: null, releaseDate: null },
            reviews: { totalPositive: 0, totalReviews: 0, playtimeMinutes: [] },
        };
        const oldRow = { [Column.originalPrice]: 459, [Column.releaseDate]: '2026 年第一季' };
        const { updates, changes } = planRefresh(unreleased, oldRow, today);

        expect(Object.keys(updates).sort()).toEqual([Column.updatedOn, Column.special, Column.detail].sort());
        expect(changes).toEqual([]);
    });
});
