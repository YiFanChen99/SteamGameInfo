import { describe, expect, it } from 'vitest';

import { extractAppId, storePageUrl } from '../src';

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

describe('storePageUrl', () => {
    it('builds the canonical URL', () => {
        expect(storePageUrl(570)).toBe('https://store.steampowered.com/app/570/');
    });
});
