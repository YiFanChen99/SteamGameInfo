> 舊的 Node CLI，邏輯已移植到 `@watchlist/core`，保留作對照。以下為原 SteamGameInfo README，指令路徑已改為從 monorepo 根目錄執行。

# SteamGame

這支腳本會把 Steam 遊戲名稱查成適合寫入 Google Sheet 的 JSON。

## Usage

```bash
node packages/core/legacy/steam_lookup.js "Settlement Survival / 部落幸存者"
node packages/core/legacy/steam_lookup.js "Settlement Survival / 部落幸存者" --mode update
node packages/core/legacy/steam_lookup.js "Settlement Survival / 部落幸存者" --mode full --debug
```

如果你要把 `最低$` 和 `最低off` 先手動帶入，也可以加：

```bash
node packages/core/legacy/steam_lookup.js "Settlement Survival / 部落幸存者" --lowest-price 99 --lowest-off 50
```

### Parameters

- 沒有加 `--debug` 時，只回傳精簡結果
- `--mode` 決定回 `full` 或 `update`
- 預設 `--mode full`

### Outputs

頂層只有三個主要欄位：

- `query`
- `matched`
- `sheet`

如果加 `--debug`，才會多出 `debug`

#### `sheet` 欄位

`sheet` 內只保留你會填表用到的欄位：

- `名稱`
- `原價`
- `最低off`
- `上市日期`
- `評價度`
- `我更新日期`
- `最低$`
- `模式`
- `特`

其中：

- `評價度` 會用 Steam「所有評論」的正評百分比
- `特` 會包含是否有 `Demo` 與支援語言
