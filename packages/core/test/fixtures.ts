import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, 'fixtures');

/** A saved store page, parsed the same way userscripts parse fetched HTML. */
export function loadStorePage(appId: number): Document {
    const html = readFileSync(join(dir, 'store', `${appId}.html`), 'utf8');
    return new DOMParser().parseFromString(html, 'text/html');
}

/** A saved, trimmed `/appreviews` response body. */
export function loadAppReviewsJson(appId: number): string {
    return readFileSync(join(dir, 'appreviews', `${appId}.json`), 'utf8');
}
