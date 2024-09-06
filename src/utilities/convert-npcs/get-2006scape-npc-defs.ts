/**
 * 2006scape npcDefinitions.xml conversion utility
 */

import { NpcServerConfig } from '@engine/config';
import * as fs from 'fs/promises';
import path from 'path';

export interface NpcDefinition {
    id: number;
    name: string;
    examine: string;
    combat: number;
    size: number; // unused on our end
    attackable: boolean;
    aggressive: boolean; // unused on our end
    retreats: boolean; // unused on our end
    poisonous: boolean; // unused on our end
    respawn: number;
    maxHit: number;
    hitpoints: number;
    attackSpeed: number;
    attackAnim: number;
    defenceAnim: number;
    deathAnim: number;
    attackBonus: number;
    defenceMelee: number;
    defenceRange: number;
    defenceMage: number;
}

export const get2006ScapeNpcDefinitions = async (): Promise<NpcDefinition[]> => {
    try {
        const d = await fs.readFile(path.join('cache','datasets','osrs-2006scape-npcDefinitions.json'));
        const r = JSON.parse(d.toString()) as NpcDefinition[];
        console.log(`read ${r.length} npc definitions`);
        return Promise.resolve(r);
    } catch (e) {
        console.error(e);
        return Promise.resolve([]);
    }
}

/**
 * This dataset has speed measured in the actual number of ticks but multiplied
 * by 1000 for some reason.
 */
const convertSpeed = (speed: number): number => {
    if (speed >= 1000) {
        return speed / 1000;
    }
    return speed;
}

export const convertToNpcs = (npcs: NpcDefinition[]): Record<string, NpcServerConfig> => {
    const s: Record<string, NpcServerConfig> = {};

    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        s[`autogen:${npc.id}`] = {
            game_id: npc.id,
            defensive_stats: {
                magic: npc.defenceMage,
                ranged: npc.defenceRange,
                crush: npc.defenceMelee, // TODO: these are likely incorrect but it's the only data we have
                stab: npc.defenceMelee, // TODO: these are likely incorrect but it's the only data we have
                slash: npc.defenceMelee, // TODO: these are likely incorrect but it's the only data we have
            },
            offensive_stats: {
                speed: convertSpeed(npc.attackSpeed),
                attack: npc.attackBonus,
                strength: npc.maxHit, // TODO: this surely isn't how strength is calculated for NPCs
            },
            animations: {
                attack: npc.attackAnim,
                death: npc.deathAnim,
                defend: npc.defenceAnim,
            },
            skills: {
                'hitpoints': npc.hitpoints,
            },
            killable: npc.attackable,
            respawn_time: npc.respawn,
            metadata: {
                name: npc.name,
                examine: npc.examine,
                combat: npc.combat,
                size: npc.size,
                attackable: npc.attackable,
                aggressive: npc.aggressive,
                retreats: npc.retreats,
                poisonous: npc.poisonous,
            },
        }
    }

    return s;
}
