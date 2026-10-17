# Fixtures

由 `pnpm --filter @watchlist/steam-info-scraper fixtures`（`scripts/fetch-fixtures.mjs`）抓取，2026-10-17。

- `store/<appid>.html`：以匿名訪客抓的商店頁（`l=tchinese&cc=tw`）
- `appreviews/<appid>.json`：`/appreviews/<appid>?json=1&language=all&purchase_type=all&filter=all&num_per_page=50`，只保留解析會讀的欄位，不含評論內文

| appid | 遊戲 | 涵蓋情境 |
|---|---|---|
| 1145360 | Hades | 已發售、原價、只支援簡中 |
| 1562430 | DREDGE | 特價中（取原價）、支援繁中 |
| 2868840 | Slay the Spire 2 | 搶先體驗；頁面有帶小數價格的組合包（需排除） |
| 1966720 | Lethal Company | 搶先體驗、只支援英文 |
| 3669620 | Warhammer Survivors | 尚未發售、沒有價格、有 Demo、沒有評論 |
| 570 | Dota 2 | 免費遊玩 |

重新抓取後 Steam 的價格、評論數會變，測試的期望值要跟著更新。
