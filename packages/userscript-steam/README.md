# Tampermonkey: Ekko Steam Watchlist

## Features

在 Steam 商店頁（`store.steampowered.com/app/*`）右上角放一個按鈕，把這款遊戲寫進遊戲追蹤 Sheet：

- Sheet 還沒有這個 AppID：顯示 **＋ 新增**，寫成新的一列。
- Sheet 已經有了：顯示 **↻ 更新**，刷新那一列的 Steam 資料，並列出原價 / 上市日期的變動。

取代舊的 [tampermonkey--steam-info-scraper](https://github.com/YiFanChen99/tampermonkey--steam-info-scraper)（擷取後貼到剪貼簿），不用再手動貼上。

## Installation

1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (Chrome) or [Violentmonkey](https://addons.mozilla.org/en-us/firefox/addon/violentmonkey/) (Firefox).
2. Open [`https://yifanchen99.github.io/game-watchlist-keeper/steam/Script.user.js`](https://yifanchen99.github.io/game-watchlist-keeper/steam/Script.user.js) and click `Install`.
3. 第一次在 Steam 商店頁執行時，輸入 Sheet API 的 token（Apps Script 專案設定裡的 `API_TOKEN`）。token 存在這支腳本自己的儲存空間，跟 SteamGifts 那支分開。

## Usage

- 資料一律重新抓 `?l=tchinese&cc=tw` 的商店頁與全語言評論，不受目前頁面的語言影響。
- **最低off** 取自 SteamDB 擴充在頁面上加的區塊，按下按鈕時才讀；免費遊戲寫 `100`，沒有原價時不寫。沒有區塊時（沒裝或還沒載入），新增寫 `-`，更新則不動。
- 新增：寫到第 4 列起第一個名稱空白的列，公式欄複製上一列，購買/期待度寫 `?`；頁面沒有價格時原價寫 `10000`。Sheet 已有這個 AppID 時會拒絕。
- 更新：原價、上市、評價度、更新日、特、備註、最低off（規則見 `@watchlist/core` 的 `planRefresh`）；名稱、購買/期待度、模式不動。
- 每個 fixture 遊戲實際送出的資料見 `packages/game-refresh/test/__snapshots__/payloads.test.ts.snap`。

## Development

在 monorepo 根目錄執行：

```sh
pnpm --filter @watchlist/userscript-steam check   # tsc --noEmit + ESLint
pnpm --filter @watchlist/userscript-steam build   # 產出 dist/Script.user.js
```

push 到 `main` 後由根目錄的 `.github/workflows/pages.yml` 發佈到 GitHub Pages 的 `/steam/`。版本號照根目錄的 `version-bump` skill 調整。
