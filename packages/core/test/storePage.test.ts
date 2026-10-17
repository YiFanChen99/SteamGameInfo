import { describe, expect, it } from 'vitest';

import { parseStorePage, type StorePageInfo } from '../src';
import { loadStorePage } from './fixtures';

type Expected = Omit<StorePageInfo, 'tags'> & { firstTags: string[] };

const cases: Record<number, Expected> = {
    1145360: {
        name: 'Hades',
        originalPrice: 408,
        releaseDate: '2020/9/17',
        isEarlyAccess: false,
        hasDemo: false,
        language: 'schinese',
        firstTags: ['動作類 Rogue', '輕度 Rogue'],
    },
    1562430: {
        name: 'DREDGE',
        originalPrice: 799,
        releaseDate: '2023/3/30',
        isEarlyAccess: false,
        hasDemo: false,
        language: 'tchinese',
        firstTags: ['探索', '釣魚'],
    },
    2868840: {
        name: 'Slay the Spire 2',
        originalPrice: 499,
        releaseDate: '2026/3/5',
        isEarlyAccess: true,
        hasDemo: false,
        language: 'schinese',
        firstTags: ['類 Rogue', '卡牌遊戲'],
    },
    1966720: {
        name: 'Lethal Company',
        originalPrice: 188,
        releaseDate: '2023/10/23',
        isEarlyAccess: true,
        hasDemo: false,
        language: 'english',
        firstTags: ['線上合作', '恐怖'],
    },
    3669620: {
        name: 'Warhammer Survivors',
        originalPrice: null,
        releaseDate: '2026/11/10',
        isEarlyAccess: false,
        hasDemo: true,
        language: 'schinese',
        firstTags: ['動作', '逆彈幕'],
    },
    570: {
        name: 'Dota 2',
        originalPrice: 0,
        releaseDate: '2013/7/9',
        isEarlyAccess: false,
        hasDemo: false,
        language: 'tchinese',
        firstTags: ['免費遊玩', '多人線上戰術競技'],
    },
};

describe('parseStorePage', () => {
    it.each(Object.entries(cases))('parses app %s', (appId, expected) => {
        const { firstTags, ...fields } = expected;
        const info = parseStorePage(loadStorePage(Number(appId)));

        expect(info).toMatchObject(fields);
        expect(info.tags.slice(0, firstTags.length)).toEqual(firstTags);
        expect(new Set(info.tags).size).toBe(info.tags.length);
    });

    it('returns unknown language and nulls on a page without those sections', () => {
        const doc = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
        expect(parseStorePage(doc)).toEqual({
            name: null,
            originalPrice: null,
            releaseDate: null,
            isEarlyAccess: false,
            hasDemo: false,
            language: 'unknown',
            tags: [],
        });
    });

    it('returns none when no preferred language has interface support', () => {
        const doc = new DOMParser().parseFromString(`
            <div id="languageTable"><table>
                <tr><th></th><th>介面</th></tr>
                <tr><td>繁體中文</td><td colspan="3">不支援</td></tr>
                <tr><td>英文</td><td></td><td><span>&#10004;</span></td></tr>
                <tr><td>日文</td><td><span>&#10004;</span></td></tr>
            </table></div>`, 'text/html');
        expect(parseStorePage(doc).language).toBe('none');
    });
});
