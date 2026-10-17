import type { StorePageInfo } from '@watchlist/steam-info-scraper';

/** Interface languages in the sheet's order of preference, and their marks. */
const preferredLanguages: readonly (readonly [language: string, mark: string])[] = [
    ['繁體中文', '繁'],
    ['簡體中文', '簡'],
    ['英文', '英'],
];
/** None of the preferred languages has interface support. */
const noLanguageMark = 'X';
/** The page has no language table, and the cell no mark to keep. */
const unknownLanguageMark = '!';

/** Every language mark this module writes, plus `無` written by the legacy steam_lookup.js. */
const knownLanguageMarks = new Set([
    ...preferredLanguages.map(([, mark]) => mark), noLanguageMark, unknownLanguageMark, '無',
]);

const demoTag = 'Demo';

/** @returns `null` when the page has no language table. */
function languageMark(interfaceLanguages: readonly string[] | null): string | null {
    if (!interfaceLanguages) {
        return null;
    }
    return preferredLanguages.find(([language]) => interfaceLanguages.includes(language))?.[1] ?? noLanguageMark;
}

/**
 * Refresh the language mark and `Demo` tag of a special cell, keeping any other tags.
 * For a blank cell this gives e.g. `繁 Demo` or `英`.
 *
 * `Demo` follows the page, so it disappears once a demo is taken down. A page without a
 * language table keeps the old language mark.
 */
export function mergeSpecial(oldSpecial: string, page: StorePageInfo): string {
    const tokens = oldSpecial.split(/\s+/).filter(Boolean);
    const oldMark = tokens.find(token => knownLanguageMarks.has(token));
    const others = tokens.filter(token => !knownLanguageMarks.has(token) && token !== demoTag);

    const mark = languageMark(page.interfaceLanguages) ?? oldMark ?? unknownLanguageMark;
    return [mark, ...(page.hasDemo ? [demoTag] : []), ...others].join(' ');
}
