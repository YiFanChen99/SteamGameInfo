#!/usr/bin/env node

const STEAM_SEARCH_URL = "https://store.steampowered.com/api/storesearch/";
const STEAM_STORE_URL = "https://store.steampowered.com/app/";
const STEAM_LOCALE = "tchinese";
const STEAM_CC = "tw";

function usage() {
  console.error(
    'Usage: node steam_lookup.js "Game Title" [--mode full|update] [--lowest-price 123] [--lowest-off 45] [--debug]'
  );
}

function cleanInputTitle(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .trim();
}

function extractAppIdFromText(value) {
  const text = String(value || "");
  const match = text.match(/app\/(\d+)/i);
  return match ? Number(match[1]) : null;
}

function splitQuerySegments(value) {
  return String(value || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    rawTitle: "",
    title: "",
    mode: "full",
    lowestPrice: null,
    lowestOff: null,
    debug: false,
  };

  const titleParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];

    if (value === "--mode") {
      args.mode = argv[i + 1] || "full";
      i += 1;
      continue;
    }
    if (value === "--lowest-price") {
      const rawPrice = argv[i + 1];
      args.lowestPrice = rawPrice === undefined ? null : Number(rawPrice);
      i += 1;
      continue;
    }
    if (value === "--lowest-off") {
      const rawOff = argv[i + 1];
      args.lowestOff = rawOff === undefined ? null : Number(rawOff);
      i += 1;
      continue;
    }
    if (value === "--debug") {
      args.debug = true;
      continue;
    }

    titleParts.push(value);
  }

  args.rawTitle = titleParts.join(" ").trim();
  args.title = cleanInputTitle(args.rawTitle);
  return args;
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function pickBestSearchResult(title, items) {
  const target = normalizeTitle(title);
  const scored = items.map((item) => {
    const candidate = normalizeTitle(item.name);
    const alias = normalizeTitle(item.alias || "");
    let score = 0;

    if (candidate === target || alias === target) score += 1000;
    if (candidate.startsWith(target) || alias.startsWith(target)) score += 120;
    if (candidate.includes(target) || alias.includes(target)) score += 60;
    if (target.includes(candidate) || target.includes(alias)) score += 30;
    score -= Math.abs(candidate.length - target.length);

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ? scored[0].item : null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function searchSteam(term) {
  const url = new URL(STEAM_SEARCH_URL);
  url.searchParams.set("term", term);
  url.searchParams.set("l", STEAM_LOCALE);
  url.searchParams.set("cc", STEAM_CC);
  const data = await fetchJson(url);
  return Array.isArray(data && data.items) ? data.items : [];
}

async function fetchStoreHtml(appid) {
  const url = new URL(`${STEAM_STORE_URL}${appid}/`);
  url.searchParams.set("l", STEAM_LOCALE);
  url.searchParams.set("cc", STEAM_CC);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Steam store page returned ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function extractAppNameFromHtml(html) {
  const text = String(html || "");
  const match1 = text.match(/<div[^>]*class="apphub_AppName"[^>]*>([^<]+)<\/div>/i);
  if (match1) return match1[1].replace(/\s+/g, " ").trim();
  const match2 = text.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (match2) return match2[1].replace(/\s+-\s+Steam$/i, "").trim();
  return null;
}

function extractReleaseDateText(html) {
  const text = String(html || "");
  const patterns = [
    /<div[^>]*class="release_date"[^>]*>[\s\S]*?<div class="date">([^<]+)<\/div>/i,
    /game_area_release_date[\s\S]*?<div class="date">([^<]+)<\/div>/i,
    /itemprop="datePublished"[^>]*content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  return null;
}

function extractPriceInfo(html, appid) {
  const text = String(html || "");
  const id = String(appid || "");
  let raw = null;

  if (id) {
    const appPackageRegex = new RegExp(
      `"appids":\\[\\s*${id}\\s*\\][\\s\\S]{0,1200}?"discount_block":"([^"]+)"`,
      "i"
    );
    const matchPackage = text.match(appPackageRegex);
    raw = matchPackage ? matchPackage[1] : null;
  }

  if (!raw) {
    const purchaseSection = text.match(
      /game_area_purchase_game[\s\S]*?(?:game_purchase_price price|discount_original_price|discount_final_price)[^>]*>([^<]+)</i
    );
    raw = purchaseSection ? purchaseSection[1].trim() : null;
  }

  if (!raw) return null;
  const priceText = String(raw).trim();
  if (!priceText) return null;

  if (priceText.toLowerCase().includes("free") || priceText.includes("免費")) {
    return 0;
  }

  const digits = priceText.replace(/[^\d]/g, "");
  const priceNumber = Number(digits);
  return Number.isFinite(priceNumber) ? priceNumber : null;
}

function extractReviewValue(html) {
  const text = String(html || "");
  const rows = text.match(/<a[^>]*class="user_reviews_summary_row"[^>]*>[\s\S]*?<\/a>/gi) || [];

  for (const row of rows) {
    if (!/itemprop="aggregateRating"/i.test(row)) continue;

    const summaryMatch = row.match(
      /<span[^>]*class="[^"]*game_review_summary[^"]*"[^>]*>([^<]+)<\/span>/i
    );
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].replace(/\s+/g, " ").trim();
    }

    const tooltipMatch = row.match(/data-tooltip-html="([^"]+)"/i);
    if (!tooltipMatch || !tooltipMatch[1]) continue;

    const tooltip = tooltipMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const percentMatch = tooltip.match(/(\d{1,3})%\s*(?:給予此遊戲好評|給予好評|好評)/);
    if (percentMatch) return String(Number(percentMatch[1]));

    const fallbackMatch = tooltip.match(/(\d{1,3})%/);
    if (fallbackMatch) return String(Number(fallbackMatch[1]));
  }

  return null;
}

function extractLanguagesText(html) {
  const text = String(html || "");
  const markers = ["繁體中文", "簡體中文", "English", "英文"];
  const hits = markers.filter((marker) => text.includes(marker));
  return hits.length ? hits.join(" ") : null;
}

function extractPopularTagsFromHtml(html) {
  const text = String(html || "");
  const tags = [];
  const tagRegex = /<a[^>]*class="[^"]*\bapp_tag\b[^"]*"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = tagRegex.exec(text))) {
    const tag = String(match[1] || "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (tag) tags.push(tag);
  }

  return [...new Set(tags)].slice(0, 10);
}

function extractHasDemo(html) {
  return /demo/i.test(String(html || ""));
}

function formatDateYMDSlash(date) {
  if (!date) return null;
  const text = String(date).trim();

  let m = text.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/);
  if (m) return `${Number(m[1])}/${Number(m[2])}/${Number(m[3])}`;

  m = text.match(/^(\d{4})[-/]\s*(\d{1,2})[-/]\s*(\d{1,2})$/);
  if (m) return `${Number(m[1])}/${Number(m[2])}/${Number(m[3])}`;

  m = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s*(\d{4})$/);
  if (m) {
    const monthMap = {
      jan: 1,
      january: 1,
      feb: 2,
      february: 2,
      mar: 3,
      march: 3,
      apr: 4,
      april: 4,
      may: 5,
      jun: 6,
      june: 6,
      jul: 7,
      july: 7,
      aug: 8,
      august: 8,
      sep: 9,
      sept: 9,
      september: 9,
      oct: 10,
      october: 10,
      nov: 11,
      november: 11,
      dec: 12,
      december: 12,
    };
    const month = monthMap[String(m[2]).toLowerCase()];
    if (month) return `${Number(m[3])}/${month}/${Number(m[1])}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
  }

  return text.replace(/-/g, "/");
}

function formatUpdateDate() {
  const now = new Date();
  return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
}

function buildSpecial(languagesText, hasDemo) {
  const parts = [];
  const normalized = String(languagesText || "").toLowerCase();

  if (
    normalized.includes("繁體") ||
    normalized.includes("traditional chinese") ||
    normalized.includes("zh-hant") ||
    normalized.includes("tchinese")
  ) {
    parts.push("繁");
  } else if (
    normalized.includes("簡體") ||
    normalized.includes("simplified chinese") ||
    normalized.includes("zh-hans") ||
    normalized.includes("schinese")
  ) {
    parts.push("簡");
  } else if (normalized.includes("english") || normalized.includes("英文")) {
    parts.push("英");
  } else {
    parts.push("無");
  }

  if (hasDemo) {
    parts.push("Demo");
  }

  return parts.slice(0, 2).join(" ");
}

function buildRowFromHtml(html, appid, fallbackName) {
  const price = extractPriceInfo(html, appid) || extractPriceInfo(html);
  const reviewValue = extractReviewValue(html);
  const releaseDate = formatDateYMDSlash(extractReleaseDateText(html));
  const languagesText = extractLanguagesText(html);
  const hasDemo = extractHasDemo(html);
  const popularTags = extractPopularTagsFromHtml(html);
  const name = extractAppNameFromHtml(html) || fallbackName || null;

  return {
    名稱: name,
    原價: price,
    最低off: null,
    上市日期: releaseDate,
    評價度: reviewValue,
    我更新日期: formatUpdateDate(),
    最低$: null,
    模式: popularTags.join(" "),
    特: buildSpecial(languagesText, hasDemo),
    _debug_tags: popularTags,
    _debug_languages: languagesText,
    _debug_has_demo: hasDemo,
  };
}

async function resolveGame(rawTitle, cleanTitle) {
  const directAppId = extractAppIdFromText(rawTitle);
  if (directAppId) {
    return {
      best: { id: directAppId, name: cleanTitle || rawTitle },
      items: [],
    };
  }

  const segments = splitQuerySegments(cleanTitle || rawTitle);
  const queries = segments.length > 1 ? segments : [cleanTitle || rawTitle];
  let items = [];

  for (const query of queries) {
    const found = await searchSteam(query);
    items = items.concat(found);
  }

  items = dedupe(items);
  const best = items.length ? (pickBestSearchResult(cleanTitle || rawTitle, items) || items[0]) : null;
  return { best, items };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.rawTitle) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolved = await resolveGame(parsed.rawTitle, parsed.title);
  if (!resolved.best) {
    const empty = { query: parsed.title, sheet: null };
    if (parsed.debug) empty.debug = { candidates: [] };
    console.log(JSON.stringify(empty, null, 2));
    return;
  }

  const html = await fetchStoreHtml(resolved.best.id);
  const row = buildRowFromHtml(html, resolved.best.id, resolved.best.name || parsed.title);

  const result = {
    query: parsed.title,
    sheet: row,
  };

  if (parsed.debug) {
    result.matched = {
      appid: resolved.best.id,
      name: row.名稱 || resolved.best.name || null,
    };
    result.debug = {
      candidates: resolved.items.slice(0, 5).map((item) => ({
        appid: item.id,
        name: item.name,
        type: item.type || null,
      })),
      store_url: `${STEAM_STORE_URL}${resolved.best.id}/`,
      popular_tags: row._debug_tags,
      supported_languages: row._debug_languages,
      has_demo: row._debug_has_demo,
      review_value_raw: extractReviewValue(html),
    };
  }

  delete result.sheet._debug_tags;
  delete result.sheet._debug_languages;
  delete result.sheet._debug_has_demo;

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
