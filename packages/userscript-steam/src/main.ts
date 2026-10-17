import { extractAppId } from '@watchlist/core';
import { addGame, formatChange, MissingValueError, refreshGame, sheetApiRowStore } from '@watchlist/game-record-writer';
import {
    createSheetApi,
    deployedWebAppUrl,
    SheetApiError,
    SheetApiUnauthorizedError,
    type SheetApi,
} from '@watchlist/sheet-api';
import { readSteamDbPrices } from '@watchlist/steam-info-scraper';

import { fetchText, forgetToken, getToken, postText } from './gm';
import { Panel } from './panel';

/**
 * Tampermonkey storage keys:
 *  sheetApiToken: the token the Apps Script web app checks
 */

type Action = 'check' | 'add' | 'update';

/** Runs `run` with the saved token; a rejected token is forgotten and asked for once more. */
async function withApi<T>(run: (api: SheetApi) => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        const token = getToken();
        if (!token) {
            throw new Error('沒有輸入 Sheet API 的 token');
        }
        try {
            return await run(createSheetApi({ webAppUrl: deployedWebAppUrl, token, fetchText, postText }));
        } catch (error) {
            if (!(error instanceof SheetApiUnauthorizedError)) {
                throw error;
            }
            forgetToken();
            if (attempt >= 2) {
                throw error;
            }
        }
    }
}

const isSheetError = (error: unknown, code: SheetApiError['code']) =>
    error instanceof SheetApiError && error.code === code;

function main(): void {
    const appId = extractAppId(window.location.pathname);
    if (appId === null) {
        console.warn(`Steam Sheet Writer: no app id in ${window.location.pathname}`);
        return;
    }

    /** What the button does now; after an error, the action that failed. */
    let action: Action = 'check';
    const panel = new Panel(() => {
        void run(action);
    });

    async function check(): Promise<void> {
        const row = await withApi(api => api.findRow(appId!));
        action = row === null ? 'add' : 'update';
        panel.setState({ kind: action });
    }

    const noSteamDbNote = '沒有 SteamDB 區塊，最低off 沒有更新。';

    async function add(): Promise<void> {
        panel.setState({ kind: 'busy', label: '新增中…' });
        // Read on click: the SteamDB extension fills its block in after the page loads.
        const steamDb = readSteamDbPrices(document);
        try {
            await withApi(api => addGame(appId!, { fetchText, store: sheetApiRowStore(api), steamDb }));
        } catch (error) {
            if (error instanceof MissingValueError) {
                // Retrying will not help; the page lacks the value. Keep it shown: nothing was added.
                panel.setState({ kind: 'add' }, error.message, true);
                return;
            }
            if (!isSheetError(error, 'duplicate')) {
                throw error;
            }
            action = 'update';
            panel.setState({ kind: 'update' }, 'Sheet 已經有這個遊戲，請改用更新。');
            return;
        }
        action = 'update';
        panel.setState({ kind: 'update' }, steamDb === null ? '已新增。沒有 SteamDB 區塊，最低off 寫 0。' : '已新增。');
    }

    async function update(): Promise<void> {
        panel.setState({ kind: 'busy', label: '更新中…' });
        const steamDb = readSteamDbPrices(document);
        try {
            const { changes } = await withApi(api =>
                refreshGame(appId!, { fetchText, store: sheetApiRowStore(api), steamDb }));
            const lines = ['已更新。', ...changes.map(formatChange), ...(steamDb === null ? [noSteamDbNote] : [])];
            panel.setState({ kind: 'update' }, lines.join('\n'));
        } catch (error) {
            if (!isSheetError(error, 'not-found')) {
                throw error;
            }
            action = 'add';
            panel.setState({ kind: 'add' }, 'Sheet 找不到這個遊戲了，可以重新新增。');
        }
    }

    async function run(current: Action): Promise<void> {
        try {
            await { check, add, update }[current]();
        } catch (error) {
            console.error('Steam Sheet Writer:', error);
            action = current;
            panel.setState({ kind: 'error' }, error instanceof Error ? error.message : String(error));
        }
    }

    void run('check');
}

main();
