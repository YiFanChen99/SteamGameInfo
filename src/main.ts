import { HeaderModifier, RegionModifier } from './domModifier';
import { getOrFetchData } from './sheetFetcher';

/**
 * User localstorage keys:
 *  ekkoGames: { games: Array, labelMap, time }
 *  ekkoGamesAccount?: 'yf'
 *  ekkoGamesRegions: Record<string, { value, time }>
 */
async function main(): Promise<void> {
    const sheetData = await getOrFetchData();
    console.log('SG-Annotator: updated');

    const pathname = window.location.pathname;
    let isGiveawaysPage: boolean;
    if (pathname.startsWith('/giveaways/search')) {
        isGiveawaysPage = true;
    } else if (pathname.startsWith('/giveaway/')) {
        isGiveawaysPage = false;
    } else {
        console.warn(`SG-Annotator: No modification applied. (Unknown page: ${pathname})`);
        return;
    }

    const headerModifier = new HeaderModifier(sheetData);
    const regionModifier = new RegionModifier();
    if (isGiveawaysPage) {
        const count = headerModifier.modifyGiveaways();
        console.log(`SG-Annotator: \`giveaways\` ${count} headers modified`);
        const regionCount = await regionModifier.modifyGiveaways();
        console.log(`SG-Annotator: \`giveaways\` ${regionCount} region tags modified`);
    } else {
        const done = headerModifier.modifyGiveaway();
        console.log(`SG-Annotator: \`giveaway\` ${done ? 'headers modified' : 'No headers modification applied.'}`);
        const regionDone = await regionModifier.modifyGiveaway();
        console.log(`SG-Annotator: \`giveaway\` ${regionDone ? 'region tags modified' : 'No region tags modification applied.'}`);
    }
}

void main();
