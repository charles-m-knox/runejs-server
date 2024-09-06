/**
 * https://raw.githubusercontent.com/2006-Scape/2006Scape/master/2006Scape%20Server/data/cfg/spawns.json
 */

import { NpcSpawnConfiguration } from '@engine/config';
import * as fs from 'fs/promises';
import path from 'path';

export interface NpcSpawnDefinition {
    maxHit: number;
    strength: number;
    attack: number;
    x: number;
    y: number;
    id: number;
    walk: number;
    height: number;
}

export const get2006scapeNpcSpawnDefinitions = async (): Promise<NpcSpawnDefinition[]> => {
    try {
        const d = await fs.readFile(path.join('cache','datasets','2006scape-npc-spawn-definitions.json'));
        const r = JSON.parse(d.toString()) as NpcSpawnDefinition[];
        console.log(`read ${r.length} npc spawn definitions`);
        return Promise.resolve(r);
    } catch (e) {
        console.error(e);
        return Promise.resolve([]);
    }
}

export const convertToSpawns = (spawns: NpcSpawnDefinition[]): NpcSpawnConfiguration[] => {
    const s: NpcSpawnConfiguration[] = [];

    for (let i = 0; i < spawns.length; i++) {
        const spawn = spawns[i];
        s.push({
            npc: `autogen:${spawn.id}`,
            spawn_x: spawn.x,
            spawn_y: spawn.y,
            spawn_level: spawn.height || undefined,
            movement_radius: spawn.walk,
        })
    }

    return s;
}
