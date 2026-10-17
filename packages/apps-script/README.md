# @watchlist/apps-script

子元件1：Google Apps Script Web App，負責查詢與寫入遊戲追蹤 Sheet。

現行程式碼的快照放在 `original/`（clasp clone，同一個專案有 `pig`、`yf` 兩個部署）。

## 把現有原始碼抓進來

1. 到 <https://script.google.com/home/usersettings> 開啟「Google Apps Script API」。
2. 在 Apps Script 網頁編輯器的「專案設定」→「ID」複製**指令碼 ID**（scriptId）。
3. 在本目錄執行（`login` 會開瀏覽器，用擁有該專案的帳號登入）：

   ```sh
   pnpm dlx @google/clasp login
   pnpm dlx @google/clasp clone <scriptId> --rootDir original
   ```

   所有檔案（含 `appsscript.json`）會放進 `original/`，並在本目錄產生 `.clasp.json`。

`pig`、`yf` 如果是兩個不同的專案（scriptId 不同），請分別 clone 到 `original-pig/`、`original-yf/`，並把產生的 `.clasp.json` 改名，以免互相覆蓋。

`original/` 是現行程式碼的快照，只用來參考與做 M1 實驗。正式版會寫在 `src/`，用 esbuild 打包到 `dist/` 後再 `clasp push`，部署規則見 PLAN 第 3 節。
