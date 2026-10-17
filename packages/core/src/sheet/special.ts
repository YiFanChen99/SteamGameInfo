import type { LanguageSupport, StorePageInfo } from '../steam/storePage';

const languageMarks: Record<LanguageSupport, string> = {
    tchinese: '繁',
    schinese: '簡',
    english: '英',
    none: 'X',
    unknown: '!',
};

/** Every language mark this module writes, plus `無` written by the legacy steam_lookup.js. */
const knownLanguageMarks = new Set([...Object.values(languageMarks), '無']);

const demoTag = 'Demo';

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

    const mark = page.language === 'unknown' && oldMark ? oldMark : languageMarks[page.language];
    return [mark, ...(page.hasDemo ? [demoTag] : []), ...others].join(' ');
}
