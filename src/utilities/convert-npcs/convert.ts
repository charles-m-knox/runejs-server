/**
 * Loads NPCs and their spawn point definitions from various files, and
 * dumps them into a single file.
 */

import path from 'path';
import { convertToNpcs, get2006ScapeNpcDefinitions } from './get-2006scape-npc-defs';
import { convertToSpawns, get2006scapeNpcSpawnDefinitions } from './get-2006scape-npc-spawns';
// import { convertToSpawns, getPastebinNpcSpawnDefinitions } from './get-pastebin-npc-spawns';
import { getExtraCacheNpcDefinitions, convertToNpcs as convertExtraToNpcs } from './get-extra-cache-npc-defs';

import * as fs from 'fs/promises';
import { getAllNpcData, getMonsters } from './get-best-monster';

export const loadConvertWriteNpcs = async () => {
    // load all the npcs first
    const npcs = await get2006ScapeNpcDefinitions();

    if (!npcs) {
        console.error('failed to retrieve npcs');
        return;
    }

    const spawns = await get2006scapeNpcSpawnDefinitions();

    if (!spawns) {
        console.error('failed to retrieve spawns');
        return;
    }

    const extraNpcs = await getExtraCacheNpcDefinitions();

    if (!spawns) {
        console.error('failed to retrieve spawns');
        return;
    }

    const monsters = await getMonsters();

    if (!monsters) {
        console.error('failed to retrieve monsters');
        return;
    }

    const convertedNpcs = convertToNpcs(npcs);
    const convertedSpawns = convertToSpawns(spawns);
    const convertedExtraNpcs = convertExtraToNpcs(extraNpcs);

    // attempt to resolve the best drop tables & stats for each of the npcs
    const npcWithMonsterData = getAllNpcData(npcs, monsters);

    const npcKeys = Object.keys(convertedNpcs);
    for (let i = 0; i < npcKeys.length; i++) {
        const npcKey = npcKeys[i];
        if (!npcWithMonsterData[npcKey]) {
            continue;
        }

        convertedNpcs[npcKey] = {
            ...npcWithMonsterData[npcKey],
            metadata: {
                ...convertedNpcs[npcKey].metadata,
                ...npcWithMonsterData[npcKey].metadata,
            }
        };
    }

    await fs.mkdir(path.join('data','config','npc-spawns','autogen'), { recursive: true })
    await fs.mkdir(path.join('data','config','npcs','autogen'), { recursive: true })
    await fs.mkdir(path.join('cache','datasets'), { recursive: true })
    await fs.writeFile(path.join('data','config','npc-spawns','autogen','autogen.json'), JSON.stringify(convertedSpawns));
    await fs.writeFile(path.join('data','config','npcs','autogen','autogen.json'), JSON.stringify(convertedNpcs));
    await fs.writeFile(path.join('cache','datasets','extra-npcs-data-from-cache.json'), JSON.stringify(convertedExtraNpcs));
}
