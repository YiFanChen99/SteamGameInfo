# @watchlist/userscript-sheet

子元件4 的 Google Sheet 備援：讀名稱方塊取得目前列號，以該列標題欄 HYPERLINK 的 AppID 呼叫 `@watchlist/game-record-writer`。

尚未實作，等 `sheet-api` 的寫入 endpoint 經 M1 定案後再做。

## 實作時注意

- **最低off 沒辦法更新**：最低off 來自 SteamDB 擴充在 Steam 商店頁上加的區塊，只有開著商店頁的腳本（`userscript-steam`）讀得到；Sheet 上和 SteamGifts 上都沒有。所以這裡跟 `userscript-steamgifts` 一樣，`refreshGame` 不傳 `steamDb`，最低off 維持舊值（規則見 `game-record-writer` 的 COLUMNS.md「最低off」）。要更新最低off，得到 Steam 商店頁按 ↻。
