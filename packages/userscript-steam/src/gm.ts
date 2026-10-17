import type { FetchText, PostText } from '@watchlist/core';

/** Tampermonkey storage key of the token the web app checks. */
const tokenKey = 'sheetApiToken';

function request(details: { method: 'GET' | 'POST'; url: string; data?: string }): Promise<string> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...details,
            ...(details.data === undefined ? {} : { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }),
            onload: (response) => {
                if (response.status < 200 || response.status >= 300) {
                    reject(new Error(`Failed to ${details.method} ${details.url}: ${response.status}`));
                    return;
                }
                resolve(response.responseText);
            },
            onerror: (error) => {
                reject(new Error(`Failed to ${details.method} ${details.url}: ${error.error}`));
            },
        });
    });
}

export const fetchText: FetchText = url => request({ method: 'GET', url });

export const postText: PostText = (url, body) => request({ method: 'POST', url, data: body });

/**
 * @returns The saved token, or one the user enters now; null when they cancel.
 */
export function getToken(): string | null {
    const saved = GM_getValue<string>(tokenKey, '');
    if (saved) {
        return saved;
    }
    const entered = window.prompt('Steam Sheet Writer: 請輸入 Sheet API 的 token（Apps Script 的 API_TOKEN）')?.trim();
    if (!entered) {
        return null;
    }
    GM_setValue(tokenKey, entered);
    return entered;
}

export function forgetToken(): void {
    GM_deleteValue(tokenKey);
}

export function copyText(text: string): void {
    GM_setClipboard(text, 'text');
}
