import { describe, expect, it } from 'vitest';

import { appReviewsUrl, extractAppId, storePageFetchUrl, storePageUrl } from '../src';

describe('extractAppId', () => {
    it.each([
        ['=HYPERLINK("https://store.steampowered.com/app/1145360/","Hades")', 1145360],
        ['https://store.steampowered.com/app/570/Dota_2/?l=tchinese', 570],
        ['https://www.steamgifts.com/giveaway/AbCdE/hades', null],
        ['Hades', null],
    ])('reads %s', (text, expected) => {
        expect(extractAppId(text)).toBe(expected);
    });
});

describe('Steam URLs', () => {
    it('builds the canonical, fetch and reviews URLs', () => {
        expect(storePageUrl(570)).toBe('https://store.steampowered.com/app/570/');
        expect(storePageFetchUrl(570)).toBe('https://store.steampowered.com/app/570/?l=tchinese&cc=tw');
        expect(appReviewsUrl(570)).toContain('/appreviews/570?json=1&language=all');
    });
});
