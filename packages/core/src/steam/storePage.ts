import { normalizeReleaseDate } from '../date';

/**
 * The best supported interface language, in the sheet's order of preference.
 * `unknown`: the page has no language table.
 */
export type LanguageSupport = 'tchinese' | 'schinese' | 'english' | 'none' | 'unknown';

export interface StorePageInfo {
    name: string | null;
    /**
     * Base game price before discount, in TWD. `0` when free to play.
     * `null` when there is no price, e.g. not yet released.
     */
    originalPrice: number | null;
    /** `YYYY/M/D`, or Steam's text when it is not a full date. */
    releaseDate: string | null;
    isEarlyAccess: boolean;
    hasDemo: boolean;
    language: LanguageSupport;
    /** User-defined tags, most popular first. */
    tags: string[];
}

function textOf(element: Element | null | undefined): string | null {
    const value = element?.textContent?.replace(/\s+/g, ' ').trim();
    return value === undefined || value === '' ? null : value;
}

/**
 * The base game's purchase block only: subscription / bundle dropdowns and the demo block are skipped.
 */
function parseOriginalPrice(doc: ParentNode): number | null {
    const action = '.game_area_purchase_game:not(.game_area_purchase_game_dropdown_subscription):not(.demo_above_purchase) .game_purchase_action';
    const priceText = textOf(doc.querySelector(`${action} .discount_original_price, ${action} .game_purchase_price`));
    if (!priceText) {
        return null;
    }
    if (/free|免費/i.test(priceText)) {
        return 0;
    }

    // e.g. `NT$ 1,190` or `NT$ 888.30`
    const digits = priceText.replace(/[^\d.]/g, '');
    const price = Number(digits);
    return digits && Number.isFinite(price) ? price : null;
}

function parseReleaseDate(doc: ParentNode): string | null {
    const dateText = textOf(doc.querySelector('.release_date .date'))
        ?? textOf(doc.querySelector('.game_area_release_date .date'))
        ?? doc.querySelector('[itemprop="datePublished"]')?.getAttribute('content');
    return dateText ? normalizeReleaseDate(dateText) : null;
}

function parseLanguage(doc: ParentNode): LanguageSupport {
    const table = doc.querySelector('#languageTable');
    if (!table) {
        return 'unknown';
    }

    // Supported means a check mark in the interface column, the cell right after the name.
    // Unsupported rows put a single `不支援` cell there instead.
    const supported = new Set<string>();
    for (const nameCell of table.querySelectorAll('tr > td:first-child')) {
        if (nameCell.nextElementSibling?.textContent?.includes('✔')) {
            supported.add(textOf(nameCell) ?? '');
        }
    }

    if (supported.has('繁體中文')) return 'tchinese';
    if (supported.has('簡體中文')) return 'schinese';
    if (supported.has('英文')) return 'english';
    return 'none';
}

function parseTags(doc: ParentNode): string[] {
    const tags = Array.from(doc.querySelectorAll('.popular_tags a.app_tag'), textOf)
        .filter((tag): tag is string => tag !== null);
    return [...new Set(tags)];
}

/**
 * Parse a store page fetched with `l=tchinese` (see `storePageFetchUrl`).
 *
 * Review scores are deliberately absent: the page only shows reviews in the visitor's
 * language. Use `parseAppReviews` instead.
 */
export function parseStorePage(doc: ParentNode): StorePageInfo {
    return {
        name: textOf(doc.querySelector('.apphub_AppName')),
        originalPrice: parseOriginalPrice(doc),
        releaseDate: parseReleaseDate(doc),
        isEarlyAccess: doc.querySelector('.early_access_header') !== null,
        hasDemo: doc.querySelector('.demo_above_purchase, #demoGameBtn') !== null,
        language: parseLanguage(doc),
        tags: parseTags(doc),
    };
}
