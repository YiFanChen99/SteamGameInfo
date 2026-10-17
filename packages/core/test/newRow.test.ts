import { describe, expect, it } from 'vitest';

import { buildNameFormula, Column, parseLowestOff, planNewRow, type SteamSnapshot } from '../src';

describe('parseLowestOff', () => {
    it('turns the lowest price into a discount off the original price', () => {
        expect(parseLowestOff('Lowest recorded price: NT$ 149 on 2025-11-26', 499)).toBe(70);
        expect(parseLowestOff('歷史最低價 NT$ 1,190', 1490)).toBe(20);
        expect(parseLowestOff('NT$ 888.30', 888.3)).toBe(0);
    });

    it('never goes below 0 when the price has gone up since', () => {
        expect(parseLowestOff('NT$ 590', 499)).toBe(0);
    });

    it('writes 100 for a free game, and - without a readable lowest price', () => {
        expect(parseLowestOff(null, 0)).toBe(100);
        expect(parseLowestOff(null, 499)).toBe('-');
        expect(parseLowestOff('No price history', 499)).toBe('-');
    });

    it('leaves the cell alone without an original price', () => {
        expect(parseLowestOff('NT$ 149', null)).toBeNull();
    });
});

describe('buildNameFormula', () => {
    it('links the canonical store URL and escapes quotes', () => {
        expect(buildNameFormula(1145360, 'Hades')).toBe('=HYPERLINK("https://store.steampowered.com/app/1145360/","Hades")');
        expect(buildNameFormula(1, 'The "Game"')).toBe('=HYPERLINK("https://store.steampowered.com/app/1/","The ""Game""")');
    });
});

describe('planNewRow', () => {
    const snapshot: SteamSnapshot = {
        page: {
            name: 'Slay the Spire 2',
            originalPrice: 499,
            releaseDate: '2026/3/5',
            isEarlyAccess: true,
            hasDemo: false,
            language: 'schinese',
            tags: [],
        },
        reviews: { positivePercent: 61, totalReviews: 205303, playtimeMinutes: [] },
        playtime: { medianHours: 125, thirdHighestHours: 725 },
    };
    const today = new Date(2026, 9, 17);

    it('fills every cell a refresh would, plus name, lowest discount and an unrated want level', () => {
        expect(planNewRow({ appId: 2868840, snapshot, lowestOff: 30, today })).toEqual({
            [Column.name]: '=HYPERLINK("https://store.steampowered.com/app/2868840/","Slay the Spire 2")',
            [Column.originalPrice]: 499,
            [Column.lowestOff]: 30,
            [Column.releaseDate]: '2026/3/5',
            [Column.reviewScore]: 61,
            [Column.updatedOn]: '2026/10/17',
            [Column.wantLevel]: '?',
            [Column.special]: '簡',
            [Column.detail]: '2026/3/5EA。中位125H，3rd.高725H。',
        });
    });

    it('writes the price placeholder and no lowest discount without a price', () => {
        const unpriced: SteamSnapshot = { ...snapshot, page: { ...snapshot.page, originalPrice: null } };
        const row = planNewRow({ appId: 42, snapshot: unpriced, lowestOff: parseLowestOff('NT$ 1', null), today });

        expect(row[Column.originalPrice]).toBe(10000);
        expect(row).not.toHaveProperty(Column.lowestOff);
    });

    it('falls back to the app id as name, and skips an unknown lowest discount', () => {
        const unnamed: SteamSnapshot = { ...snapshot, page: { ...snapshot.page, name: null } };
        const row = planNewRow({ appId: 42, snapshot: unnamed, lowestOff: null, today });

        expect(row[Column.name]).toBe('=HYPERLINK("https://store.steampowered.com/app/42/","42")');
        expect(row).not.toHaveProperty(Column.lowestOff);
    });
});
