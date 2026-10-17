# @watchlist/apps-script

子元件1：Google Apps Script Web App，負責查詢與寫入遊戲追蹤 Sheet。這個 script 綁定在 Sheet 上。

## 行為

- `doGet`：回傳 `STEAM` 工作表的整表傾印（`{ games, labelMap }`，格式與型別定義在 `@watchlist/sheet-api`）。請求要帶 `?token=`，跟 script property `API_TOKEN` 比對；沒設定 `API_TOKEN` 時一律拒絕。
- 傾印結果 gzip 後分塊存在 CacheService，最長 6 小時；手動編輯 Sheet 時由 `onEdit` 清掉。
- `WantToOwned`：Sheet 自訂函式，沿用原專案。

部署設定在 `appsscript.json`：以部署者身分執行（`USER_DEPLOYING`）、匿名存取（`ANYONE_ANONYMOUS`），由 token 把關。

## 目錄

- `src/`：原始碼。`main.ts` 的每個 export 都會在 `dist/Code.js` 尾端宣告成全域函式（清單在 `scripts/build.mjs`）。
- `original/`：搬進 repo 前的線上程式碼快照，只供參考，不會部署。
- `dist/`：`pnpm build` 的產出（`Code.js` + `appsscript.json`），也是 `.clasp.json` 的 `rootDir`。不進版控。

## 部署

repo 是唯一來源：`clasp push` 會整包覆蓋線上專案，不要在網頁編輯器改程式碼。

第一次使用：到 <https://script.google.com/home/usersettings> 開啟「Google Apps Script API」，再執行 `pnpm dlx @google/clasp login`（用擁有專案的帳號）。

在本目錄執行：

```sh
pnpm push                                            # build 後 clasp push，更新線上 HEAD
pnpm dlx @google/clasp deployments                   # 列出部署
pnpm dlx @google/clasp deploy -i <deploymentId>      # 把既有部署更新到新版本，/exec URL 不變
```

`clasp deploy` 不帶 `-i` 會新建一個部署（新的 URL）。userscript 用的部署 ID 寫在 `packages/userscript-steamgifts/src/sheetFetcher.ts`。

### token

在 Apps Script 網頁編輯器的「專案設定」→「指令碼屬性」新增 `API_TOKEN`。每台電腦的 userscript 第一次執行時會要求輸入同一個值。
