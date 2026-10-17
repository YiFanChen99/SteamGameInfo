# @watchlist/steam-info-scraper

抓 Steam 並把一款遊戲的資料解析成原始值（數字、字串、日期），前身是 [tampermonkey--steam-info-scraper](https://github.com/YiFanChen99/tampermonkey--steam-info-scraper)（已封存）。

不含任何 Sheet 格式；轉成 Sheet 欄位是 `@watchlist/game-record-writer` 的事。

## Features

| 來源 | 函式 | 取得 |
| --- | --- | --- |
| 商店頁 | `parseStorePage` | 名稱、原價（TWD，特價時取原價，免費為 `0`）、發售日、搶先體驗、Demo、支援介面的語言、使用者標籤 |
| `/appreviews` API | `parseAppReviews` | 所有語言的正評數 / 總評論數、抽樣評論者的遊玩時數（分鐘） |
| SteamDB 擴充套件的區塊 | `readSteamDbPrices` / `parseSteamDbPrices` | 史低價格 |

- `fetchSteamSnapshot(appId, fetchText)`：同時抓商店頁與評論，回傳 `{ page, reviews }`。
- `parseReleaseDate`：讀 Steam 的日期文字（`2020 年 9 月 17 日`、`17 Sep, 2020` 等）；`2026 年第四季` 之類不是完整日期的，`date` 為 `null`。

## Usage

### 前提

- 不直接發網路請求：`fetchSteamSnapshot` 的 `fetchText` 由呼叫端注入（userscript 用 `GM_xmlhttpRequest`，測試用 fixtures），所以能在 Node 上跑測試。HTML 預設用瀏覽器的 `DOMParser` 解析，Node 上要傳 `parseHtml`。
- 商店頁要用 `storePageFetchUrl` 抓：它固定 `l=tchinese&cc=tw`，解析器依賴繁中字樣與台幣價格。
- 評價度不從商店頁讀：頁面只顯示訪客語言的評論，改由 `appReviewsUrl`（`language=all`，每次 40 篇）取得。
- SteamDB 區塊不在抓下來的 HTML 裡，只能在使用者開著的商店頁上讀，而且擴充套件是在頁面載入後才加上去，要用到時再呼叫 `readSteamDbPrices(document)`；沒有區塊時回 `null`。

### 使用者

- `game-record-writer`：`fetchSteamSnapshot` 與各型別，組出新增 / 更新列的欄位值。
- `userscript-steam`：在商店頁上 `readSteamDbPrices`。

## Development

在 monorepo 根目錄：

```sh
pnpm --filter @watchlist/steam-info-scraper test       # vitest，跑 test/fixtures 的離線資料
pnpm --filter @watchlist/steam-info-scraper fixtures   # 重新抓 fixtures（scripts/fetch-fixtures.mjs）
```

- fixtures 涵蓋的情境與注意事項見 [`test/fixtures/README.md`](test/fixtures/README.md)。重抓後價格、評論數會變，測試的期望值要跟著更新。
- `scripts/fetch-fixtures.mjs` 無法 import `src/urls.ts`，評論查詢參數是複製一份的，改 `appReviewsUrl` 時兩邊要一起改。
