import { createNameMatcher } from '@watchlist/core';

import { findAppId, RefreshButton, type OnRefreshed } from './refreshButton';
import type { SheetData, SheetGame } from './types';

/**
 * Format data from Google Sheet to display text.
 */
class HeaderDisplayFormatter {
    static currentYear = new Date().getFullYear();

    static toWant(games: SheetGame[]): string {
        const want = games.map(game => (game.K)).join('/');
        return `${/^(\d|$)/.test(want) ? 'W' : 'W-'}${want}`;
    }

    /**
     * @returns /Y\d{2}/ | ''
     */
    static toUpdateYear(games: SheetGame[]): string {
        const earliest = games.reduce<Date | null>((min, game) => {
            if (!game.G) {
                return min;
            }
            const date = new Date(game.G);
            return (!min || date < min) ? date : min;
        }, null);
        if (!earliest) {
            return 'Y-';
        }
        const year = earliest.getFullYear();
        return year < (this.currentYear - 3) ? `Y${String(year).slice(2)}` : '';
    }
}

/**
 * Whether ↻ may refresh this game's row: not when its 購買/期待度 is 4 or 5. A defence for now,
 * because 目前評價 cannot be updated yet.
 */
function isRefreshable(game: SheetGame): boolean {
    return !['4', '5'].includes(String(game.K).trim());
}

/** The span holding a header's annotation, so it can be replaced. */
const annotationClass = 'ekko-annotation';

export class HeaderModifier {
    /**
     * Matches a giveaway name (maybe with an extra 'xxx edition') to sheet games.
     * One game on exact match, otherwise all partial matches.
     */
    private readonly matchGames: (rawName: string) => SheetGame[];
    /** Created the first time a header shows a year mark, then reused so a busy one stays busy. */
    private readonly refreshButtons = new WeakMap<HTMLElement, RefreshButton>();

    constructor(sheetData: SheetData, private readonly onRefreshed: OnRefreshed) {
        this.matchGames = createNameMatcher(sheetData.games, game => game.B);
    }

    /**
     * @returns Count of modified giveaways
     */
    modifyGiveaways(): number {
        const headers = document.querySelectorAll<HTMLElement>('.giveaway__heading__name');
        // next should be .giveaway__heading__thin
        let count = 0;
        headers.forEach((header) => {
            if (this.modify(header)) {
                count += 1;
            }
        });
        return count;
    }

    /**
     * @returns Whether the giveaway was modified
     */
    modifyGiveaway(): boolean {
        const header = document.querySelector<HTMLElement>('.featured__heading__medium');
        // next should be .featured__heading__small
        return this.modify(header);
    }

    /**
     * Match header name with sheet data and modify DOM.
     * Running it again replaces the annotation, e.g. after a refresh changed the update date.
     *
     * A year mark gets a ↻ inside it, e.g. `(W4) (Y19↻)`, when the giveaway's Steam link has an
     * app id (a bundle's `sub/` link has none) and no matched game has 購買/期待度 4 or 5. The
     * refresh drops the mark, and the ↻ with it.
     * @returns Whether modified successfully
     */
    private modify(headerElement: HTMLElement | null): boolean {
        if (!headerElement) return false;

        const name = headerElement.innerText.replace(/(\.{3})$/, '');
        const games = this.matchGames(name);

        if (!games.length) {
            return false;
        }

        const want = HeaderDisplayFormatter.toWant(games);
        const year = HeaderDisplayFormatter.toUpdateYear(games);

        const pointElement = headerElement.nextElementSibling;
        if (!(pointElement instanceof HTMLElement)) {
            return false;
        }
        let annotation = pointElement.querySelector<HTMLElement>(`.${annotationClass}`);
        if (!annotation) {
            annotation = document.createElement('span');
            annotation.className = annotationClass;
            pointElement.append(annotation);
        }
        const refresh = year && games.every(isRefreshable)
            ? this.refreshButtonFor(headerElement, annotation)
            : undefined;
        annotation.replaceChildren(
            ` (${want})`,
            ...(year ? [` (${year}`, ...(refresh ? [refresh.button] : []), ')'] : []),
        );
        return true;
    }

    /** The header's ↻, its status put after `annotation`; undefined without an app id. */
    private refreshButtonFor(headerElement: HTMLElement, annotation: HTMLElement): RefreshButton | undefined {
        let refresh = this.refreshButtons.get(headerElement);
        if (!refresh) {
            const appId = headerElement.parentElement && findAppId(headerElement.parentElement);
            if (!appId) {
                return undefined;
            }
            refresh = new RefreshButton(appId, this.onRefreshed);
            this.refreshButtons.set(headerElement, refresh);
            annotation.after(refresh.status);
        }
        return refresh;
    }
}


interface CacheEntry<T> {
    value: T;
    time: number;
}

class Cache<T> {
    private readonly key: string;
    /** in ms */
    private readonly duration: number;
    private cache: Record<string, CacheEntry<T>> = {};
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(key: string, duration: number) {
        this.key = key;
        this.duration = duration;
        this.load();
        this.clearExpired();
    }

    private load(): void {
        try {
            const raw = localStorage.getItem(this.key);
            this.cache = raw ? (JSON.parse(raw) as Record<string, CacheEntry<T>>) : {};
        } catch {
            this.cache = {};
        }
    }

    private save(): void {
        localStorage.setItem(this.key, JSON.stringify(this.cache));
    }

    private saveDebounced(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.save();
            this.saveTimeout = null;
        }, 30 * 1000);
    }

    private clearExpired(): void {
        const now = Date.now();
        for (const [key, value] of Object.entries(this.cache)) {
            if (!value.time || (now - value.time > this.duration)) {
                delete this.cache[key];
                this.saveDebounced();
            }
        }
    }

    get(url: string): T | undefined {
        const now = Date.now();
        const entry = this.cache[url];
        if (entry && now - entry.time <= this.duration) {
            return entry.value;
        }
        return undefined;
    }

    set(url: string, value: T): void {
        this.cache[url] = { value, time: Date.now() };
        this.saveDebounced();
    }
}

export class RegionModifier {
    private readonly cache: Cache<number>;

    constructor() {
        const cacheDuration = 24 * 60 * 60 * 1000; // 1D
        this.cache = new Cache('ekkoGamesRegions', cacheDuration);
    }

    /**
     * @returns Count of modified giveaways
     */
    async modifyGiveaways(): Promise<number> {
        const regions = document.querySelectorAll<HTMLAnchorElement>('.giveaway__column--region-restricted');
        let count = 0;
        for (const region of regions) {
            if (await this.modify(region)) {
                count += 1;
            }
        }
        return count;
    }

    /**
     * @returns Whether the giveaway was modified
     */
    async modifyGiveaway(): Promise<boolean> {
        const region = document.querySelector<HTMLAnchorElement>('.featured__column--region-restricted');
        return await this.modify(region);
    }

    /**
     * @param regionElement form `<a href="/giveaway/xxxxx/griftlands/region-restrictions">`
     * @returns Whether modified successfully
     */
    private async modify(regionElement: HTMLAnchorElement | null): Promise<boolean> {
        if (!regionElement?.href) {
            return false;
        }

        try {
            const counts = await this.fetchRegionCounts(regionElement.href);
            regionElement.appendChild(document.createTextNode(`${counts}`));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    private async fetchRegionCounts(url: string): Promise<number> {
        const cached = this.cache.get(url);
        if (cached !== undefined) {
            return cached;
        }

        return await new Promise<number>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: (response) => {
                    if (response.status !== 200) {
                        return reject(new Error(`Failed to fetch ${url}: ${response.status}`));
                    }

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const resultsSelector = '.pagination__results';
                    const text = doc.querySelector<HTMLElement>(resultsSelector)?.innerText;
                    if (!text) {
                        return reject(new Error(`Results text not found in ${url}`));
                    }
                    // Keep parse failures inside the promise: an escaping throw would
                    // leave it forever pending, hanging every `await` down the line.
                    let count: number;
                    try {
                        count = this.parseRegionCounts(text);
                    } catch (error) {
                        return reject(error instanceof Error ? error : new Error(String(error)));
                    }
                    this.cache.set(url, count);
                    resolve(count);
                },
                onerror: (error) => {
                    return reject(new Error(`Failed to fetch ${url}: ${error.error}`));
                },
            });
        });
    }

    /**
     * @param text Region results text
     */
    private parseRegionCounts(text: string): number {
        if (text.includes('No results')) {
            return 0;
        }

        const total = /(?:\d+) to (?:\d+) of (\d+) result/.exec(text)?.[1];
        if (total === undefined) {
            throw new Error(`Unexpected results text format: ${text}`);
        }
        return parseInt(total, 10);
    }
}
