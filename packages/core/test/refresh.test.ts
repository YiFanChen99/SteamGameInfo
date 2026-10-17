import { describe, expect, it } from 'vitest';

import {
    buildDetail,
    buildRefreshUpdates,
    Column,
    mergeDetail,
    type PlaytimeStats,
    type SteamSnapshot,
    type StorePageInfo,
} from '../src';

const page: StorePageInfo = {
    name: 'Slay the Spire 2',
    originalPrice: 499,
    releaseDate: '2026/3/5',
    isEarlyAccess: true,
    hasDemo: false,
    language: 'schinese',
    tags: [],
};
const playtime: PlaytimeStats = { medianHours: 125, thirdHighestHours: 725 };
const snapshot: SteamSnapshot = {
    page,
    reviews: { positivePercent: 61, totalReviews: 205303, playtimeMinutes: [] },
    playtime,
};
const today = new Date(2026, 9, 17);

describe('buildDetail', () => {
    it('writes early access date, language and playtime like the legacy scraper', () => {
        expect(buildDetail(page, playtime)).toBe('2026/3/5EA。簡。中位125H，3rd.高725H。');
    });

    it('omits the early access part and marks unknown numbers', () => {
        const released: StorePageInfo = { ...page, isEarlyAccess: false, language: 'tchinese' };
        expect(buildDetail(released, { medianHours: 3, thirdHighestHours: null })).toBe('繁。中位3H，3rd.高-H。');
    });
});

describe('mergeDetail', () => {
    it('replaces only the playtime part, keeping hand-written notes', () => {
        expect(mergeDetail('2026/3/5EA。簡。中位40H，3rd.高300H。等正式版', playtime))
            .toBe('2026/3/5EA。簡。中位125H，3rd.高725H。等正式版');
    });

    it('replaces NaN values left by the legacy scraper', () => {
        expect(mergeDetail('英。中位NaNH，3rd.高NaNH。', playtime)).toBe('英。中位125H，3rd.高725H。');
    });

    it('appends playtime when the cell has none', () => {
        expect(mergeDetail('繁。', playtime)).toBe('繁。中位125H，3rd.高725H。');
    });
});

describe('buildRefreshUpdates', () => {
    it('replaces Steam-owned values and merges the detail cell', () => {
        const oldRow = {
            [Column.originalPrice]: 459,
            [Column.reviewScore]: 70,
            [Column.lowestOff]: 30,
            [Column.detail]: '2026/3/5EA。簡。中位40H，3rd.高300H。',
        };
        expect(buildRefreshUpdates(snapshot, oldRow, today)).toEqual({
            [Column.originalPrice]: 499,
            [Column.releaseDate]: '2026/3/5',
            [Column.reviewScore]: 61,
            [Column.updatedOn]: '2026/10/17',
            [Column.detail]: '2026/3/5EA。簡。中位125H，3rd.高725H。',
        });
    });

    it('builds a full detail cell for an empty one', () => {
        const updates = buildRefreshUpdates(snapshot, { [Column.detail]: '  ' }, today);
        expect(updates[Column.detail]).toBe('2026/3/5EA。簡。中位125H，3rd.高725H。');
    });

    it('leaves cells alone when Steam has no value', () => {
        const unreleased: SteamSnapshot = {
            page: { ...page, originalPrice: null, releaseDate: null },
            reviews: { positivePercent: null, totalReviews: 0, playtimeMinutes: [] },
            playtime: { medianHours: null, thirdHighestHours: null },
        };
        expect(Object.keys(buildRefreshUpdates(unreleased, {}, today)).sort())
            .toEqual([Column.updatedOn, Column.detail].sort());
    });
});
