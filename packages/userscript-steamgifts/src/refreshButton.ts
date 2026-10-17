import { extractAppId } from '@watchlist/core';
import { formatChange } from '@watchlist/game-record-writer';
import { SheetApiError } from '@watchlist/sheet-api';

import { refreshRow } from './refresh';

/** Called after a row was written, with its whole name cell and the date written as 更新日. */
export type OnRefreshed = (name: string, updatedOn: Date) => void;

/** How long a message stays unless it reports a failure, which stays until clicked (as in userscript-steam). */
const messageLifetimeMs = 60_000;

/** A ↻ button plus its status bubble, for one giveaway heading; the caller places both. */
export class RefreshButton {
    readonly button = document.createElement('button');
    /** Kept apart from the button, so a message outlives a ↻ the refresh took away. */
    readonly status = document.createElement('span');
    private hideTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(private readonly appId: number, private readonly onRefreshed: OnRefreshed) {
        this.button.type = 'button';
        this.button.textContent = '↻';
        this.button.title = '用 Steam 的資料刷新 Sheet 的這一列';
        // A bare glyph inside the year mark's parentheses, e.g. `(Y19↻)`.
        Object.assign(this.button.style, {
            margin: '0 0 0 2px', padding: '0', border: 'none', background: 'none',
            font: 'inherit', color: 'inherit', cursor: 'pointer',
        });
        Object.assign(this.status.style, {
            display: 'none', marginLeft: '6px', padding: '2px 6px', whiteSpace: 'pre-line', verticalAlign: 'middle',
            fontSize: '12px', fontWeight: 'normal', lineHeight: '16px',
            color: '#fff', background: 'rgba(0, 0, 0, 0.7)', borderRadius: '3px', cursor: 'pointer',
        });
        this.status.title = '點一下關閉';
        this.button.addEventListener('click', () => {
            void this.refresh();
        });
        this.status.addEventListener('click', () => {
            this.showMessage('', false);
        });
    }

    private async refresh(): Promise<void> {
        this.button.disabled = true;
        this.button.textContent = '…';
        this.showMessage('', false);
        try {
            const today = new Date();
            const { name, changes } = await refreshRow(this.appId, today);
            this.onRefreshed(name, today);
            this.showMessage(['已更新。', ...changes.map(formatChange)].join('\n'), false);
        } catch (error) {
            if (error instanceof SheetApiError && error.code === 'not-found') {
                // Nothing was written: keep it shown, like a failure.
                this.showMessage('Sheet 沒有這個遊戲，要新增請到 Steam 商店頁。', true);
            } else {
                console.error('SteamGifts Annotator:', error);
                this.showMessage(error instanceof Error ? error.message : String(error), true);
            }
        } finally {
            this.button.disabled = false;
            this.button.textContent = '↻';
        }
    }

    /** @param persist Keep the message until clicked instead of hiding it after a minute. */
    private showMessage(message: string, persist: boolean): void {
        clearTimeout(this.hideTimer);
        this.status.textContent = message;
        this.status.style.display = message ? 'inline-block' : 'none';
        if (message && !persist) {
            this.hideTimer = setTimeout(() => {
                this.showMessage('', false);
            }, messageLifetimeMs);
        }
    }
}

/**
 * @param heading `.giveaway__heading` on the list page, `.featured__heading` on a giveaway page.
 * @returns The app id of the heading's Steam link; null for a bundle's `sub/` link or none.
 */
export function findAppId(heading: Element): number | null {
    for (const link of heading.querySelectorAll<HTMLAnchorElement>('a[href*="store.steampowered.com/"]')) {
        const appId = extractAppId(link.href);
        if (appId !== null) {
            return appId;
        }
    }
    return null;
}
