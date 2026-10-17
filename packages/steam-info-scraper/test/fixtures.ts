import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { FetchText } from '@watchlist/core';

const dir = join(import.meta.dirname, 'fixtures');

/** A saved store page's HTML. */
export function loadStorePageHtml(appId: number): string {
    return readFileSync(join(dir, 'store', `${appId}.html`), 'utf8');
}

/** A saved store page, parsed the same way userscripts parse fetched HTML. */
export function loadStorePage(appId: number): Document {
    return new DOMParser().parseFromString(loadStorePageHtml(appId), 'text/html');
}

/** A saved, trimmed `/appreviews` response body. */
export function loadAppReviewsJson(appId: number): string {
    return readFileSync(join(dir, 'appreviews', `${appId}.json`), 'utf8');
}

/**
 * Serves the saved store page and reviews of any fixture app, as `fetchSteamSnapshot` requests them.
 * Other packages' tests use it too.
 */
export const fixtureFetchText: FetchText = (url) => {
    const appId = Number(/\/(?:app|appreviews)\/(\d+)/.exec(url)?.[1]);
    if (url.startsWith('https://store.steampowered.com/appreviews/')) {
        return Promise.resolve(loadAppReviewsJson(appId));
    }
    if (url.startsWith('https://store.steampowered.com/app/')) {
        return Promise.resolve(loadStorePageHtml(appId));
    }
    return Promise.reject(new Error(`unexpected URL ${url}`));
};
