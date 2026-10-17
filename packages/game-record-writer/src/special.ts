import type { StorePageInfo } from '@watchlist/steam-info-scraper';

/** Interface languages in the sheet's order of preference, and their marks. */
const preferredLanguages: readonly (readonly [language: string, mark: string])[] = [
    ['繁體中文', '繁'],
    ['簡體中文', '簡'],
    ['英文', '英'],
];
/** None of the preferred languages has interface support. */
const noLanguageMark = 'X';
/** A new row whose page has no language table. */
const unknownLanguageMark = '!';

const demoTag = 'Demo';

/**
 * Lower is preferred. A hand-written language part ranks below the preferred languages but
 * above `X`, so only a real 繁 / 簡 / 英 replaces it. `!` (unknown) ranks last.
 */
function languageRank(language: string): number {
    const preferred = preferredLanguages.findIndex(([, mark]) => mark === language);
    if (preferred >= 0) return preferred;
    if (language === noLanguageMark || language === '無') return preferredLanguages.length + 1;
    if (language === unknownLanguageMark) return preferredLanguages.length + 2;
    return preferredLanguages.length;
}

/** @returns `null` when the page has no language table. */
function languageMark(interfaceLanguages: readonly string[] | null): string | null {
    if (!interfaceLanguages) {
        return null;
    }
    return preferredLanguages.find(([language]) => interfaceLanguages.includes(language))?.[1] ?? noLanguageMark;
}

/**
 * The special cell: a language part, then `Demo` when the page has a demo (COLUMNS.md 特).
 *
 * The old language part is everything but `Demo`, possibly hand-written. The page's mark
 * replaces it only when it ranks higher (see `languageRank`), so a refresh never downgrades it.
 * Without a language table the old part stays; a blank cell gets `!`.
 *
 * e.g. old `英`, page with simplified Chinese and a demo → `簡 Demo`.
 */
export function mergeSpecial(oldSpecial: string, page: StorePageInfo): string {
    const oldLanguage = oldSpecial.split(/\s+/).filter(token => token && token !== demoTag).join(' ');
    const mark = languageMark(page.interfaceLanguages);

    let language: string;
    if (!oldLanguage) {
        language = mark ?? unknownLanguageMark;
    } else if (mark !== null && languageRank(mark) < languageRank(oldLanguage)) {
        language = mark;
    } else {
        language = oldLanguage;
    }
    return page.hasDemo ? `${language} ${demoTag}` : language;
}
