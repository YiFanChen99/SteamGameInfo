---
name: version-bump
description: Decide and apply the version bump of each userscript package (packages/userscript-*). Use before committing or pushing changes in this repo.
---

每支 userscript 的 `packages/userscript-<site>/package.json` 的 `version` 即它的 `@version`（見該 package 的 `scripts/metadata.mjs`）；Tampermonkey 只在 `@version` 變大時才更新已安裝的腳本。library（`core`、`sheet-api` 等）不發佈，沒有要 bump 的版本。

## 哪些變更算某支 userscript 的變更

userscript 會把它依賴的 workspace library 一起打包，所以下列路徑的 commit 都算：

- `packages/userscript-<site>/`
- 它 `package.json` 的 `dependencies` 中每個 `@watchlist/<name>` 對應的 `packages/<name>/`（只看直接依賴即可，library 之間的依賴也要一路算進去）

## 級距

依 conventional commit type 決定：

- `fix`、`perf` → patch
- `feat` → minor
- 帶 `!` 的 breaking change → major
- 其他 type（`docs`、`chore`、`ci`、`refactor`、`style`、`test`、`build`）→ 不 bump

## 步驟

一次 push 算一個 release，所以目標版本永遠以 `origin/main` 為基準重新計算。對每支有變更的 userscript 分別做（路徑相對於 repo 根目錄）：

1. 基準版本：`git show origin/main:packages/userscript-<site>/package.json` 的 `version`。
2. 級距：`git log --format=%s origin/main..HEAD -- <上一節的路徑>` 的每個 subject，加上這次要 commit 的變更，取最高級距。
3. 目標版本 = 基準版本套用該級距。
4. 比對目前 `package.json` 的 `version`：
   - 等於目標 → 不動。
   - 不等於目標 → 直接改 `package.json` 的 `version`（`pnpm-lock.yaml` 不記錄 workspace package 自己的 version），bump 放進當下這個 commit；若在 push 前才發現，amend 到最後一個未 push 的 commit。

完成條件：每支有變更的 userscript，目前 `version` 都等於目標版本。

## userscript-steamgifts 的來歷

它原本由獨立的 annotator repo 發佈，2.0.2 起改由本 repo 發佈。原 repo 已停止發佈，所以直接在這裡修改，照上面的步驟 bump；不要再從原 repo `git subtree pull`。
