/**
 * Single source of truth for the userscript metadata block.
 *
 * `@updateURL` is intentionally omitted: when absent, Tampermonkey falls back to
 * `@downloadURL` for update checks, so there is no second file to keep in sync.
 *
 * `version`, `description` and `author` are read from package.json so they cannot drift.
 * `name` stays separate: package.json holds the npm slug, this holds the display name.
 */

import pkg from '../package.json' with { type: 'json' };

const pagesBaseUrl = 'https://yifanchen99.github.io/tampermonkey--steamgifts-annotator';

/** Repeated keys (`match`, `connect`) are expressed as arrays. */
export const metadata = {
    name: 'Ekko SteamGifts Annotator',
    namespace: 'https://github.com/YiFanChen99/tampermonkey--steamgifts-annotator',
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    match: [
        '*://www.steamgifts.com/giveaways/search*',
        '*://www.steamgifts.com/giveaway/*',
    ],
    grant: 'GM_xmlhttpRequest',
    connect: [
        'script.google.com',
        // Apps Script web apps 302-redirect /exec responses here.
        'script.googleusercontent.com',
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
