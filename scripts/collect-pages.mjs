/**
 * Gather every built userscript into one GitHub Pages site.
 *
 * packages/userscript-<site>/dist/* → _site/<site>/*, plus an index page linking each
 * Script.user.js. Run after `pnpm -r build`.
 */

import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const prefix = 'userscript-';
const packagesDir = new URL('../packages/', import.meta.url);
const siteDir = new URL('../_site/', import.meta.url);

await rm(siteDir, { recursive: true, force: true });
await mkdir(siteDir, { recursive: true });

const sites = [];
for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
    const dist = new URL(`${entry.name}/dist/`, packagesDir);
    if (!entry.isDirectory() || !entry.name.startsWith(prefix) || !existsSync(dist)) {
        continue;
    }
    const site = entry.name.slice(prefix.length);
    await cp(dist, new URL(`${site}/`, siteDir), { recursive: true });
    sites.push(site);
}

if (!sites.length) {
    throw new Error('No built userscripts found; run `pnpm -r build` first.');
}

const links = sites
    .map(site => `    <li><a href="${site}/Script.user.js">${site}</a></li>`)
    .join('\n');
await writeFile(new URL('index.html', siteDir), `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>game-watchlist-keeper userscripts</title>
</head>
<body>
  <h1>game-watchlist-keeper userscripts</h1>
  <ul>
${links}
  </ul>
</body>
</html>
`);

console.log(`Collected ${sites.join(', ')} -> _site/`);
