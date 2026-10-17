/**
 * GET `url` and resolve with the response body. Rejects on network errors and non-2xx statuses.
 *
 * Libraries take this as a parameter instead of calling `GM_xmlhttpRequest` or `fetch`
 * themselves: each userscript injects its own, and tests inject fakes.
 */
export type FetchText = (url: string) => Promise<string>;

/**
 * POST `body` as `text/plain` to `url` and resolve with the response body, following redirects.
 * Rejects like `FetchText`.
 */
export type PostText = (url: string, body: string) => Promise<string>;
