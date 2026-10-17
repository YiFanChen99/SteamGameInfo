import { describe, expect, it, vi } from 'vitest';

import { createSheetApi, SheetApiUnauthorizedError } from '../src';

const webAppUrl = 'https://script.google.com/macros/s/xxx/exec';
const token = 'a b&c';

describe('createSheetApi().fetchDump', () => {
    it('GETs the web app URL with the encoded token and returns its games', async () => {
        const fetchText = vi.fn(() => Promise.resolve('{"games":[{"B":"Hades","K":3}],"labelMap":{"K":"想要"}}'));

        const dump = await createSheetApi({ webAppUrl, token, fetchText }).fetchDump();

        expect(fetchText).toHaveBeenCalledWith(`${webAppUrl}?token=a%20b%26c`);
        expect(dump).toEqual({ games: [{ B: 'Hades', K: 3 }], labelMap: { K: '想要' } });
    });

    it('throws SheetApiUnauthorizedError when the web app rejects the token', async () => {
        const fetchText = () => Promise.resolve('{"error":"unauthorized"}');

        await expect(createSheetApi({ webAppUrl, token, fetchText }).fetchDump())
            .rejects.toBeInstanceOf(SheetApiUnauthorizedError);
    });

    it('rejects any other response without games', async () => {
        const fetchText = () => Promise.resolve('{"error":"login"}');

        await expect(createSheetApi({ webAppUrl, token, fetchText }).fetchDump()).rejects.toThrow('no games');
    });
});
