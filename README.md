# game-watchlist-keeper

讓一份 Google Sheet 遊戲追蹤清單與 Steam、SteamGifts、ITAD 價格通知保持同步的工具集。

pnpm workspace monorepo，每個 `packages/*` 都是獨立的 node module，以 `@watchlist/<name>` 互相引用，皆 `private`、不發佈。

## Packages

| package | 類型 | 說明 |
|---|---|---|
| `core` | library | 不做 I/O 的純函式：Steam 頁面解析、遊戲時長統計、欄名型別、名稱正規化、新舊值整合規則 |
| `sheet-api` | library | Apps Script Web App 的 client |
| `game-refresh` | library | 抓 Steam → 與舊值整合 → 寫回 Sheet 的流程 |
| `price-lookup` | library | 遊戲 id / 名稱 → 價格資訊 |
| `apps-script` | Apps Script | Sheet 查詢 / 寫入的 Web App 原始碼 |
| `userscript-steamgifts` | userscript | SteamGifts：想要程度標註、區域限制計數、資料刷新 |
| `userscript-gmail` | userscript | Gmail：ITAD 通知的價格查詢面板 |
| `userscript-sheet` | userscript | Google Sheet：資料刷新備援 |

library 不直接呼叫 `GM_xmlhttpRequest`，網路請求由 userscript 注入，所以 library 可以直接在 Node 上跑測試。

## Development

```sh
pnpm install
pnpm check      # 各 package 的 tsc --noEmit + ESLint，加上根目錄腳本的 ESLint
pnpm -r test    # vitest
pnpm -r build   # 產出各 userscript 的 dist/
```

push 到 `main` 後由 `.github/workflows/pages.yml` 建置，將每支 userscript 發佈到 GitHub Pages 的 `/<網站>/Script.user.js`。

## Legacy

- `packages/core/legacy/steam_lookup.js`：舊的 Node CLI（`node packages/core/legacy/steam_lookup.js "遊戲名"` → Sheet 欄位 JSON），邏輯已移植到 `core`，保留作對照。用法與輸出欄位見 [`packages/core/legacy/README.md`](packages/core/legacy/README.md)。
- `google_sheet_b1_d3.js`：以 Google Sheets API + OAuth token 讀取 B1:D3 的實驗腳本。**目前沒有任何 package 用到**（新架構改走 Apps Script Web App）。
