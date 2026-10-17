import { describe, expect, it, vi } from 'vitest';

import {
    appReviewsUrl,
    fetchSteamSnapshot,
    parseReleaseDate,
    parseSteamDbPrices,
    readSteamDbPrices,
    storePageFetchUrl,
} from '../src';
import { loadAppReviewsJson, loadStorePageHtml } from './fixtures';

describe('parseReleaseDate', () => {
    it.each([
        ['2020 年 9 月 17 日', { year: 2020, month: 9, day: 17 }],
        ['2026年3月5日', { year: 2026, month: 3, day: 5 }],
        ['2020-09-17', { year: 2020, month: 9, day: 17 }],
        ['2020/9/7', { year: 2020, month: 9, day: 7 }],
        ['17 Sep, 2020', { year: 2020, month: 9, day: 17 }],
        ['Sep 17, 2020', { year: 2020, month: 9, day: 17 }],
    ])('reads %s', (text, date) => {
        expect(parseReleaseDate(text)).toEqual({ text, date });
    });

    it.each(['2026 年第四季', '即將推出', ' 待定 '])('keeps partial date %s as text only', (text) => {
        expect(parseReleaseDate(text)).toEqual({ text: text.trim(), date: null });
    });
});

describe('SteamDB block', () => {
    it('reads the first price, with thousands separators and decimals', () => {
        expect(parseSteamDbPrices('Lowest recorded price: NT$ 149 on 2025-11-26')).toEqual({ lowestPrice: 149 });
        expect(parseSteamDbPrices('歷史最低價 NT$ 1,190').lowestPrice).toBe(1190);
        expect(parseSteamDbPrices('NT$ 888.30').lowestPrice).toBe(888.3);
        expect(parseSteamDbPrices('No price history').lowestPrice).toBeNull();
    });

    it('tells a missing block from one without a price', () => {
        const page = (body: string) => new DOMParser().parseFromString(`<body>${body}</body>`, 'text/html');

        expect(readSteamDbPrices(page(''))).toBeNull();
        expect(readSteamDbPrices(page('<div class="steamdb_prices_top">NT$ 99</div>'))).toEqual({ lowestPrice: 99 });
        expect(readSteamDbPrices(page('<div class="steamdb_prices_top">loading</div>'))).toEqual({ lowestPrice: null });
    });
});

describe('fetchSteamSnapshot', () => {
    it('fetches the tchinese TW store page and all-language reviews', async () => {
        const fetchText = vi.fn((url: string) => Promise.resolve(
            url.includes('/appreviews/') ? loadAppReviewsJson(2868840) : loadStorePageHtml(2868840),
        ));

        const snapshot = await fetchSteamSnapshot(2868840, fetchText);

        expect(fetchText.mock.calls.map(([url]) => url).sort()).toEqual([appReviewsUrl(2868840), storePageFetchUrl(2868840)].sort());
        expect(storePageFetchUrl(570)).toBe('https://store.steampowered.com/app/570/?l=tchinese&cc=tw');
        expect(snapshot.page).toMatchObject({ name: 'Slay the Spire 2', originalPrice: 499, isEarlyAccess: true });
        expect(snapshot.reviews.playtimeMinutes).toHaveLength(50);
    });
});
