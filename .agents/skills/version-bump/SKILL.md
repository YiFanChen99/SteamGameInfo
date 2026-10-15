---
name: version-bump
description: Decide and apply the userscript version bump. Use before committing or pushing changes in this repo.
---

`package.json` 的 `version` 即 userscript 的 `@version`（見 scripts/metadata.mjs）；Tampermonkey 只在 `@version` 變大時才更新已安裝的腳本。

## 級距

依 conventional commit type 決定：

- `fix`、`perf` → patch
- `feat` → minor
- 帶 `!` 的 breaking change → major
- 其他 type（`docs`、`chore`、`ci`、`refactor`、`style`、`test`、`build`）→ 不 bump

## 步驟

一次 push 算一個 release，所以目標版本永遠以 `origin/main` 為基準重新計算：

1. 基準版本：`git show origin/main:package.json` 的 `version`。
2. 級距：`git log --format=%s origin/main..HEAD` 的每個 subject，加上這次要 commit 的變更，取最高級距。
3. 目標版本 = 基準版本套用該級距。
4. 比對目前 `package.json` 的 `version`：
   - 等於目標 → 不動。
   - 不等於目標 → `npm version <目標> --no-git-tag-version`（會一起更新 package-lock.json），bump 放進當下這個 commit；若在 push 前才發現，amend 到最後一個未 push 的 commit。

完成條件：目前 `version` 等於目標版本。
