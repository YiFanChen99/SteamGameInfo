import { HeaderModifier, RegionModifier } from './domModifier';
import { getOrFetchData, markUpdated } from './sheetFetcher';

/**
 * User localstorage keys:
 *  ekkoGames: { games: Array, labelMap, time }
 *  ekkoGamesRegions: Record<string, { value, time }>
 * Tampermonkey storage keys:
 *  sheetApiToken: the token the Apps Script web app checks
 */
async function main(): Promise<void> {
    const sheetData = await getOrFetchData();
    console.log('SteamGifts Annotator: updated');

    const pathname = window.location.pathname;
    let isGiveawaysPage: boolean;
    if (pathname.startsWith('/giveaways/search')) {
        isGiveawaysPage = true;
    } else if (pathname.startsWith('/giveaway/')) {
        isGiveawaysPage = false;
    } else {
        console.warn(`SteamGifts Annotator: No modification applied. (Unknown page: ${pathname})`);
        return;
    }

    /** A refresh wrote 更新日: update the cached dump, then the annotations (the year mark may go). */
    const onRefreshed = (name: string, updatedOn: Date) => {
        if (!markUpdated(sheetData, name, updatedOn)) {
            return;
        }
        if (isGiveawaysPage) {
            headerModifier.modifyGiveaways();
        } else {
            headerModifier.modifyGiveaway();
        }
    };
    const headerModifier = new HeaderModifier(sheetData, onRefreshed);
    const regionModifier = new RegionModifier();
    if (isGiveawaysPage) {
        const count = headerModifier.modifyGiveaways();
        console.log(`SteamGifts Annotator: \`giveaways\` ${count} headers modified`);
        const regionCount = await regionModifier.modifyGiveaways();
        console.log(`SteamGifts Annotator: \`giveaways\` ${regionCount} region tags modified`);
    } else {
        const done = headerModifier.modifyGiveaway();
        console.log(`SteamGifts Annotator: \`giveaway\` ${done ? 'headers modified' : 'No headers modification applied.'}`);
        const regionDone = await regionModifier.modifyGiveaway();
        console.log(`SteamGifts Annotator: \`giveaway\` ${regionDone ? 'region tags modified' : 'No region tags modification applied.'}`);
    }
}

main().catch((error: unknown) => {
    console.error('SteamGifts Annotator:', error);
});
