/**
 * Single source of truth for the userscript metadata block.
 *
 * `@updateURL` is intentionally omitted: when absent, Tampermonkey falls back to
 * `@downloadURL` for update checks, so there is no second file to keep in sync.
 */

const pagesBaseUrl = 'https://yifanchen99.github.io/tampermonkey--steamgifts-annotator';

/** Repeated keys (`match`, `connect`) are expressed as arrays. */
export const metadata = {
    name: 'Ekko SteamGifts Annotator',
    namespace: 'https://github.com/YiFanChen99/tampermonkey--steamgifts-annotator',
    version: '2.0.0',
    description: 'Annotate SteamGifts giveaways with wishlist rating (from Google Sheet) and region-restriction count',
    author: 'YiFanChen99',
    match: [
        '*://www.steamgifts.com/giveaways/search*',
        '*://www.steamgifts.com/giveaway/*',
    ],
    grant: 'GM_xmlhttpRequest',
    connect: [
        'script.google.com',
        'www.steamgifts.com',
    ],
    icon: `${pagesBaseUrl}/favicon.ico`,
    downloadURL: `${pagesBaseUrl}/Script.user.js`,
};

/**
 * @returns {string} The `// ==UserScript== ... // ==/UserScript==` block.
 */
export function buildBanner() {
    const entries = Object.entries(metadata).flatMap(([key, value]) =>
        (Array.isArray(value) ? value : [value]).map(item => [key, item])
    );
    const keyWidth = Math.max(...entries.map(([key]) => key.length));

    const lines = entries.map(
        ([key, value]) => `// @${key.padEnd(keyWidth)}  ${value}`
    );
    return ['// ==UserScript==', ...lines, '// ==/UserScript==', ''].join('\n');
}
