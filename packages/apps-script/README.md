# @watchlist/apps-script

子元件1：Google Apps Script Web App，負責查詢與寫入遊戲追蹤 Sheet。這個 script 綁定在 Sheet 上。

## 行為

所有請求都要帶 `?token=`，跟 script property `API_TOKEN` 比對；沒設定 `API_TOKEN` 時一律拒絕。格式與型別定義在 `@watchlist/sheet-api`。拒絕時回 `{ error, message }`（HTTP 仍是 200）。

- `doGet`：
  - 不帶 `action`：`STEAM` 工作表的整表傾印（`{ games, labelMap }`）。
  - `action=row&appId=<id>&columns=<欄名>,<欄名>`：名稱欄連到這個 AppID 的那一列，回 `{ row, values }`。日期格式是 `YYYY/M/D`。
- `doPost`：body 是 JSON 的 `WriteRequest`。
  - `update`：只寫指定的欄位。名稱、公式欄（例如 最低$）不能寫，目前含公式的格子也不能寫。
  - `append`：先確認 Sheet 沒有這個 AppID（有的話回 `duplicate`），再寫到第 4 列起第一個名稱空白的列。上一列的公式（名稱除外）用 R1C1 複製下來，其餘寫入指定欄位。
  - 寫入期間持有 script lock，寫完清掉傾印快取。
- 欄位一律以第 1 列的標題名稱定位。AppID 只從名稱欄的 HYPERLINK 公式找（名稱一律是 HYPERLINK，沒有用「插入連結」的格子）。
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

`clasp deploy` 不帶 `-i` 會新建一個部署（新的 URL）。userscript 用的部署 URL 寫在 `packages/sheet-api/src/index.ts` 的 `deployedWebAppUrl`。

### token

在 Apps Script 網頁編輯器的「專案設定」→「指令碼屬性」新增 `API_TOKEN`。每台電腦的 userscript 第一次執行時會要求輸入同一個值。
