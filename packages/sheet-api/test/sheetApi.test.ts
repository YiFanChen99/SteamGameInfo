import { describe, expect, it, vi } from 'vitest';

import { createSheetApi } from '../src';

const webAppUrl = 'https://script.google.com/macros/s/xxx/exec';

describe('createSheetApi().fetchDump', () => {
    it('GETs the web app URL and returns its games', async () => {
        const fetchText = vi.fn(() => Promise.resolve('{"games":[{"B":"Hades","K":3}],"labelMap":{"K":"想要"}}'));

        const dump = await createSheetApi({ webAppUrl, fetchText }).fetchDump();

        expect(fetchText).toHaveBeenCalledWith(webAppUrl);
        expect(dump).toEqual({ games: [{ B: 'Hades', K: 3 }], labelMap: { K: '想要' } });
    });

    it('rejects a response without games, e.g. a Google login page', async () => {
        const fetchText = () => Promise.resolve('{"error":"login"}');

        await expect(createSheetApi({ webAppUrl, fetchText }).fetchDump()).rejects.toThrow('no games');
    });
});
